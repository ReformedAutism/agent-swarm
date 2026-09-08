import { createActor } from "@/backend";
import type {
  Agent,
  LearningRecord,
  Network,
  SimulationControl,
  SimulationState,
  SwarmStats,
  TradeRecord,
  TreasuryState,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * The swarm backend surface this frontend depends on.
 *
 * The generated bindings (`@/backend`) expose the real canister methods. The
 * actor returned by `useActor(createActor)` is a `Backend` instance whose
 * `Agent` / `SwarmStats` shapes are structurally identical to the frontend
 * domain types in `@/types`, so we describe the swarm methods here and cast
 * the actor to keep the query layer typed against the frontend contract.
 */
interface SwarmActor {
  listAgents(): Promise<Agent[]>;
  getAgent(id: bigint): Promise<Agent | null>;
  getSwarmStats(): Promise<SwarmStats>;
  advanceTick(): Promise<void>;
  setSimulationControl(control: SimulationControl): Promise<void>;
  resetSwarm(): Promise<void>;
  spotlightAgent(id: bigint): Promise<void>;
  listLearningRecords(): Promise<LearningRecord[]>;
  getAgentLearning(agentId: bigint): Promise<LearningRecord[]>;
  getTreasury(): Promise<TreasuryState>;
  listTrades(): Promise<TradeRecord[]>;
  getAgentTrades(agentId: bigint): Promise<TradeRecord[]>;
  listNetworks(): Promise<Network[]>;
  getNetwork(networkId: bigint): Promise<Network | null>;
  createNetwork(name: string): Promise<bigint>;
  joinNetwork(networkId: bigint, agentId: bigint): Promise<void>;
  leaveNetwork(networkId: bigint, agentId: bigint): Promise<void>;
}

function asSwarmActor(actor: unknown): SwarmActor {
  return actor as SwarmActor;
}

/* ------------------------------------------------------------------ */
/* Client-side simulation state store                                  */
/*                                                                     */
/* The backend exposes the current `tick` through `getSwarmStats()` but */
/* does not expose `running` or `spotlightAgentId` via any query. We    */
/* track those two on the client (persisted to localStorage) and merge  */
/* them with the backend `tick` so the whole app shares one source of   */
/* truth for the simulation's live state.                               */
/* ------------------------------------------------------------------ */

const SIM_STATE_KEY = "wealthtrack.simulation";

interface PersistedSimState {
  running: boolean;
  spotlightAgentId: string | null;
}

function loadPersisted(): PersistedSimState {
  try {
    const raw = localStorage.getItem(SIM_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedSimState>;
      return {
        running: parsed.running ?? true,
        spotlightAgentId: parsed.spotlightAgentId ?? null,
      };
    }
  } catch {
    // ignore malformed persisted state
  }
  return { running: true, spotlightAgentId: null };
}

const persisted = loadPersisted();
let running = persisted.running;
let spotlightAgentId: bigint | null =
  persisted.spotlightAgentId === null
    ? null
    : BigInt(persisted.spotlightAgentId);

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getRunning() {
  return running;
}

function getSpotlight() {
  return spotlightAgentId;
}

function setRunningStore(value: boolean) {
  running = value;
  persist();
  emit();
}

function setSpotlightStore(value: bigint | null) {
  spotlightAgentId = value;
  persist();
  emit();
}

function persist() {
  try {
    localStorage.setItem(
      SIM_STATE_KEY,
      JSON.stringify({
        running,
        spotlightAgentId:
          spotlightAgentId === null ? null : spotlightAgentId.toString(),
      } satisfies PersistedSimState),
    );
  } catch {
    // ignore storage failures
  }
}

/* ------------------------------------------------------------------ */
/* Agents                                                              */
/* ------------------------------------------------------------------ */

export function useAgents() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      if (!actor) return [];
      return asSwarmActor(actor).listAgents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAgent(id: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Agent | null>({
    queryKey: ["agents", id],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return asSwarmActor(actor).getAgent(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Swarm stats                                                         */
/* ------------------------------------------------------------------ */

export function useSwarmStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SwarmStats>({
    queryKey: ["swarm-stats"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return asSwarmActor(actor).getSwarmStats();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Learning records                                                    */
/* ------------------------------------------------------------------ */

export function useLearningRecords() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LearningRecord[]>({
    queryKey: ["learning-records"],
    queryFn: async () => {
      if (!actor) return [];
      return asSwarmActor(actor).listLearningRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAgentLearning(agentId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LearningRecord[]>({
    queryKey: ["learning-records", agentId],
    queryFn: async () => {
      if (!actor || agentId === undefined) return [];
      return asSwarmActor(actor).getAgentLearning(agentId);
    },
    enabled: !!actor && !isFetching && agentId !== undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Treasury                                                            */
/* ------------------------------------------------------------------ */

export function useTreasury() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TreasuryState>({
    queryKey: ["treasury"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return asSwarmActor(actor).getTreasury();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Trades                                                              */
/* ------------------------------------------------------------------ */

export function useTrades() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TradeRecord[]>({
    queryKey: ["trades"],
    queryFn: async () => {
      if (!actor) return [];
      return asSwarmActor(actor).listTrades();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAgentTrades(agentId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TradeRecord[]>({
    queryKey: ["trades", agentId],
    queryFn: async () => {
      if (!actor || agentId === undefined) return [];
      return asSwarmActor(actor).getAgentTrades(agentId);
    },
    enabled: !!actor && !isFetching && agentId !== undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Networks                                                            */
/* ------------------------------------------------------------------ */

export function useNetworks() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Network[]>({
    queryKey: ["networks"],
    queryFn: async () => {
      if (!actor) return [];
      return asSwarmActor(actor).listNetworks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useNetwork(networkId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Network | null>({
    queryKey: ["networks", networkId],
    queryFn: async () => {
      if (!actor || networkId === undefined) return null;
      return asSwarmActor(actor).getNetwork(networkId);
    },
    enabled: !!actor && !isFetching && networkId !== undefined,
  });
}

export function useCreateNetwork() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return asSwarmActor(actor).createNetwork(name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["networks"] });
    },
  });
}

export function useJoinNetwork() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      networkId,
      agentId,
    }: { networkId: bigint; agentId: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return asSwarmActor(actor).joinNetwork(networkId, agentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["networks"] });
    },
  });
}

export function useLeaveNetwork() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      networkId,
      agentId,
    }: { networkId: bigint; agentId: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return asSwarmActor(actor).leaveNetwork(networkId, agentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["networks"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Simulation state + controls                                         */
/* ------------------------------------------------------------------ */

export function useSimulationState(): SimulationState & {
  pause: () => void;
  resume: () => void;
  reset: () => Promise<void>;
  setSpotlight: (id: bigint | null) => void;
} {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { data: stats } = useSwarmStats();

  const runningValue = useSyncExternalStore(subscribe, getRunning);
  const spotlightValue = useSyncExternalStore(subscribe, getSpotlight);

  const pause = useCallback(() => {
    setRunningStore(false);
    if (actor) void asSwarmActor(actor).setSimulationControl("pause");
  }, [actor]);

  const resume = useCallback(() => {
    setRunningStore(true);
    if (actor) void asSwarmActor(actor).setSimulationControl("resume");
  }, [actor]);

  const reset = useCallback(async () => {
    if (!actor) return;
    await asSwarmActor(actor).resetSwarm();
    setRunningStore(true);
    setSpotlightStore(null);
    void queryClient.invalidateQueries({ queryKey: ["agents"] });
    void queryClient.invalidateQueries({ queryKey: ["swarm-stats"] });
  }, [actor, queryClient]);

  const setSpotlight = useCallback(
    (id: bigint | null) => {
      setSpotlightStore(id);
      if (actor && id !== null) void asSwarmActor(actor).spotlightAgent(id);
    },
    [actor],
  );

  return {
    running: runningValue,
    tick: stats?.tick ?? 0n,
    spotlightAgentId: spotlightValue,
    pause,
    resume,
    reset,
    setSpotlight,
  };
}

/* ------------------------------------------------------------------ */
/* Simulation driver                                                   */
/*                                                                     */
/* Advances the simulation on a periodic tick while it is running and   */
/* refetches agents + stats so the dashboard numbers update live.       */
/* ------------------------------------------------------------------ */

export function useSimulationDriver(intervalMs = 4000) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const runningValue = useSyncExternalStore(subscribe, getRunning);

  useEffect(() => {
    if (!actor || !runningValue) return;

    const id = setInterval(() => {
      void asSwarmActor(actor)
        .advanceTick()
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ["agents"] });
          void queryClient.invalidateQueries({ queryKey: ["swarm-stats"] });
          void queryClient.invalidateQueries({
            queryKey: ["learning-records"],
          });
          void queryClient.invalidateQueries({ queryKey: ["trades"] });
          void queryClient.invalidateQueries({ queryKey: ["treasury"] });
          void queryClient.invalidateQueries({ queryKey: ["networks"] });
        })
        .catch(() => {
          // transient network errors should not stop the loop
        });
    }, intervalMs);

    return () => clearInterval(id);
  }, [actor, runningValue, intervalMs, queryClient]);
}
