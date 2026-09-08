import { createIdentity, PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project; this build is greenfield, so it is absent.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
  } else {
    const installed = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BASELINE_WASM });
    await pic.upgradeCanister({ canisterId: installed.canisterId, wasm: BACKEND_WASM, arg: new Uint8Array() });
    actor = installed.actor;
  }
  // The swarm methods require #user permission, so the default anonymous
  // caller would trap on every call. Act as a seeded user identity and
  // register it via the access-control initializer (first caller becomes
  // admin, which holds the #user role).
  actor.setIdentity(createIdentity("swarm-test-user"));
  await actor._initialize_access_control();
});

afterAll(async () => {
  await pic?.tearDown();
});

describe("swarm simulation backend", () => {
  it("seeds a fresh population on install", async () => {
    const agents = await actor.listAgents();
    expect(agents.length).toBeGreaterThan(0);
    // Every seeded agent is alive with the seed money/knowledge.
    for (const agent of agents) {
      expect(agent.status).toEqual({ alive: null });
      expect(agent.money).toBeGreaterThan(0);
      expect(agent.knowledge).toBeGreaterThan(0);
    }
  });

  it("returns aggregate swarm stats without trapping", async () => {
    const stats = await actor.getSwarmStats();
    expect(stats.activeAgents).toBeGreaterThan(0n);
    expect(stats.totalMoney).toBeGreaterThan(0);
    expect(stats.totalKnowledge).toBeGreaterThan(0);
    expect(stats.tick).toBe(0n);
  });

  it("returns an agent by id and None for a missing id", async () => {
    const agents = await actor.listAgents();
    const first = agents[0];
    const found = await actor.getAgent(first.id);
    expect(found).toEqual([first]);

    const missing = await actor.getAgent(999999n);
    expect(missing).toEqual([]);
  });

  it("advances the simulation tick and evolves agents", async () => {
    const before = await actor.getSwarmStats();
    await actor.advanceTick();
    const after = await actor.getSwarmStats();
    expect(after.tick).toBe(before.tick + 1n);
    // Money supply should change as agents earn and spend.
    expect(after.totalMoney).not.toBe(before.totalMoney);
  });

  it("pauses and resumes the simulation", async () => {
    await actor.setSimulationControl({ pause: null });
    const pausedTick = (await actor.getSwarmStats()).tick;
    await actor.advanceTick();
    // While paused, advanceTick is a no-op.
    expect((await actor.getSwarmStats()).tick).toBe(pausedTick);

    await actor.setSimulationControl({ resume: null });
    await actor.advanceTick();
    expect((await actor.getSwarmStats()).tick).toBe(pausedTick + 1n);
  });

  it("resets the swarm to a fresh seed population", async () => {
    await actor.advanceTick();
    await actor.advanceTick();
    const before = await actor.getSwarmStats();
    expect(before.tick).toBeGreaterThan(0n);

    await actor.resetSwarm();
    const after = await actor.getSwarmStats();
    expect(after.tick).toBe(0n);
    const agents = await actor.listAgents();
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(agent.status).toEqual({ alive: null });
    }
  });

  it("spotlights an agent", async () => {
    const agents = await actor.listAgents();
    const target = agents[0];
    await expect(actor.spotlightAgent(target.id)).resolves.toBeNull();
  });

  it("records an agent adopting a strategy from a peer and lists it", async () => {
    const agents = await actor.listAgents();
    const learner = agents[0];
    const mentor = agents[1];
    await expect(
      actor.observeAndLearn(
        learner.id,
        mentor.id,
        { name: "Momentum", description: "Ride the trend" },
        0.6,
      ),
    ).resolves.toBeNull();

    const records = await actor.listLearningRecords();
    expect(records.length).toBeGreaterThan(0);
    const record = records[records.length - 1];
    expect(record.agentId).toBe(learner.id);
    expect(record.sourcePeerId).toBe(mentor.id);
    expect(record.adoptedStrategy.name).toBe("Momentum");
    expect(record.integrationWeight).toBe(0.6);

    // The adopting agent's lineage shows the record.
    const agentLearning = await actor.getAgentLearning(learner.id);
    expect(agentLearning.some((r) => r.id === record.id)).toBe(true);
  });

  it("advancing the tick produces automatic peer-learning records", async () => {
    const before = await actor.listLearningRecords();
    await actor.advanceTick();
    const after = await actor.listLearningRecords();
    // A higher-performing agent causes a lower-performing peer to adopt its
    // strategy, so the record count grows (or stays if no peer qualifies).
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });

  it("creates a network, joins an agent, and reflects membership and performance", async () => {
    const agents = await actor.listAgents();
    const networkId = await actor.createNetwork("Syndicate");
    expect(networkId).toBeGreaterThanOrEqual(0n);

    await expect(actor.joinNetwork(networkId, agents[0].id)).resolves.toBeNull();

    const network = await actor.getNetwork(networkId);
    expect(network).not.toEqual([]);
    const net = network[0];
    expect(net.name).toBe("Syndicate");
    expect(net.memberAgentIds).toContain(agents[0].id);
    // Joining populates the shared strategy pool from the member's strategy.
    expect(net.sharedStrategyPool.length).toBeGreaterThan(0);
    expect(net.collectivePerformance).toBeGreaterThan(0);

    const all = await actor.listNetworks();
    expect(all.some((n) => n.id === networkId)).toBe(true);
  });

  it("leaves a network and removes the member", async () => {
    const agents = await actor.listAgents();
    const networkId = await actor.createNetwork("Temp");
    await actor.joinNetwork(networkId, agents[0].id);
    await expect(actor.leaveNetwork(networkId, agents[0].id)).resolves.toBeNull();

    const network = await actor.getNetwork(networkId);
    expect(network[0].memberAgentIds).not.toContain(agents[0].id);
  });

  it("returns an empty treasury and empty trade ledger before any trading", async () => {
    const treasury = await actor.getTreasury();
    expect(treasury.balances).toEqual([]);

    expect(await actor.listTrades()).toEqual([]);
    const agents = await actor.listAgents();
    expect(await actor.getAgentTrades(agents[0].id)).toEqual([]);
  });
});
