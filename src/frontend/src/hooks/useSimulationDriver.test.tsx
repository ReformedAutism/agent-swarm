import { useSimulationDriver } from "@/hooks/useQueries";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const advanceTick = vi.fn();
const invalidateQueries = vi.fn();
let mockActor: unknown = null;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

// useQueries imports createActor from @/backend, which transitively pulls in
// @caffeineai/object-storage (a module that does not resolve in the jsdom test
// environment). The driver never calls createActor directly — it receives the
// actor from the mocked useActor — so stub the backend module out.
vi.mock("@/backend", () => ({
  createActor: () => ({}),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe("useSimulationDriver", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    advanceTick.mockReset();
    invalidateQueries.mockReset();
    advanceTick.mockResolvedValue(undefined);
    mockActor = {
      advanceTick,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances the simulation on a periodic tick and refetches agents and stats", async () => {
    const queryClient = makeQueryClient();
    queryClient.invalidateQueries = invalidateQueries;

    const { result } = renderHook(() => useSimulationDriver(1000), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });
    expect(result.current).toBeUndefined();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(advanceTick).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["agents"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["swarm-stats"],
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(advanceTick).toHaveBeenCalledTimes(3);
  });

  it("does not advance when there is no actor", async () => {
    mockActor = null;
    const queryClient = makeQueryClient();
    queryClient.invalidateQueries = invalidateQueries;

    renderHook(() => useSimulationDriver(1000), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(advanceTick).not.toHaveBeenCalled();
  });
});
