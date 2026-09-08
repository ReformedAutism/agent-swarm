import { createIdentity, PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
const PREVIOUS_WASM = process.env.BACKEND_WASM_PREVIOUS ?? "";

let pic: PocketIc | undefined;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
});

afterAll(async () => {
  await pic?.tearDown();
});

it("carries the swarm population through the upgrade and initializes the new swarm-extension state", async () => {
  // 1. Install the version the user is actually running (the previous revision).
  // The current Candid is a superset of the previous one, and only methods that
  // exist in both interfaces are called below, so the current idlFactory is
  // sufficient to drive the previous canister.
  const previous = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: PREVIOUS_WASM,
  });

  // The swarm methods require #user permission, so act as a seeded user and
  // register it via the access-control initializer (first caller becomes admin).
  previous.actor.setIdentity(createIdentity("swarm-upgrade-user"));
  await previous.actor._initialize_access_control();

  // 2. Write data through the OLD public API, as the deployed app did.
  const agentsBefore = await previous.actor.listAgents();
  expect(agentsBefore.length).toBeGreaterThan(0);
  await previous.actor.advanceTick();

  // 3. Upgrade to the version this build produces. The migration runs here.
  await pic.upgradeCanister({
    canisterId: previous.canisterId,
    wasm: BACKEND_WASM,
    upgradeModeOptions: {
      skip_pre_upgrade: [],
      wasm_memory_persistence: [{ keep: null }],
    },
  });

  // 4. Read through the NEW API and assert both survival and the new shape.
  const upgraded = pic.createActor<_SERVICE>(idlFactory, previous.canisterId);
  upgraded.setIdentity(createIdentity("swarm-upgrade-user"));
  const agentsAfter = await upgraded.listAgents();
  expect(agentsAfter.length).toBe(agentsBefore.length);
  // The migration preserves the evolved population (tick advanced past 0).
  const stats = await upgraded.getSwarmStats();
  expect(stats.tick).toBeGreaterThan(0n);

  // The new swarm-extension state is initialized empty rather than trapping.
  expect(await upgraded.listLearningRecords()).toEqual([]);
  expect(await upgraded.listTrades()).toEqual([]);
  expect(await upgraded.listNetworks()).toEqual([]);
  const treasury = await upgraded.getTreasury();
  expect(treasury.balances).toEqual([]);
});
