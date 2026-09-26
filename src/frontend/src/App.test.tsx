import App from "@/App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockIsAuthenticated = false;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    isAuthenticated: mockIsAuthenticated,
    isInitializing: false,
  }),
}));

// App wires the real TanStack Router; only the data layer is mocked. The
// protected layout drives the simulation and the shell reads simulation state,
// so both hooks are stubbed here. The Evolution Core page consumes the core
// metrics / rules / orchestration hooks, so they are stubbed too.
vi.mock("@/hooks/useQueries", () => ({
  useSimulationDriver: () => undefined,
  useSimulationState: () => ({
    running: true,
    tick: 0n,
    spotlightAgentId: null,
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
    setSpotlight: vi.fn(),
  }),
  useCoreMetrics: () => ({ data: undefined, isLoading: false }),
  useRules: () => ({ data: [], isLoading: false }),
  useOrchestrationLog: () => ({ data: [], isLoading: false }),
  useAdvanceEpoch: () => ({ mutate: vi.fn(), isPending: false }),
  useResetEvolutionCore: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("App routing", () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    window.history.replaceState({}, "", "/");
  });

  function renderApp() {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );
  }

  it("renders the landing page on the default route without a blank screen", async () => {
    renderApp();

    expect(
      await screen.findByRole("heading", {
        name: /achieve knowledge and control/i,
      }),
    ).toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor away from a protected route", async () => {
    renderApp();

    await act(async () => {
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // The protected layout bounces back to the landing page.
    expect(
      await screen.findByRole("heading", {
        name: /achieve knowledge and control/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /swarm command/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the Evolution Core page on the /evolution route", async () => {
    mockIsAuthenticated = true;
    renderApp();

    await act(async () => {
      window.history.pushState({}, "", "/evolution");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(
      await screen.findByRole("heading", { name: /evolution core/i }),
    ).toBeInTheDocument();
  });
});
