import { Layout } from "@/components/Layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clearIdentity = vi.fn();
let mockRunning = true;
let mockTick = 0n;
let mockPathname = "/dashboard";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({ clear: clearIdentity }),
}));

vi.mock("@/hooks/useQueries", () => ({
  useSimulationState: () => ({ running: mockRunning, tick: mockTick }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  Outlet: () => null,
  useLocation: () => ({ pathname: mockPathname }),
}));

function renderLayout() {
  const queryClient = new QueryClient();
  const clearSpy = vi.spyOn(queryClient, "clear");
  render(
    <QueryClientProvider client={queryClient}>
      <Layout />
    </QueryClientProvider>,
  );
  return { clearSpy };
}

describe("Layout", () => {
  beforeEach(() => {
    mockRunning = true;
    mockTick = 0n;
    mockPathname = "/dashboard";
    clearIdentity.mockClear();
  });

  it("renders the brand and the primary navigation links", () => {
    renderLayout();

    expect(screen.getByRole("link", { name: /nexus swarm/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /networks/i })).toHaveAttribute(
      "href",
      "/networks",
    );
    expect(screen.getByRole("link", { name: /evolution/i })).toHaveAttribute(
      "href",
      "/evolution",
    );
  });

  it("shows the live simulation indicator with the current tick while running", () => {
    mockRunning = true;
    mockTick = 7n;
    renderLayout();

    const indicator = screen.getByTestId("nav.simulation_indicator");
    expect(indicator).toHaveTextContent("LIVE");
    expect(indicator).toHaveAttribute("title", "Simulation running · tick 7");
  });

  it("shows the paused indicator when the simulation is not running", () => {
    mockRunning = false;
    renderLayout();

    const indicator = screen.getByTestId("nav.simulation_indicator");
    expect(indicator).toHaveTextContent("PAUSED");
    expect(indicator).toHaveAttribute("title", "Simulation paused");
  });

  it("signs out by clearing the identity and the query cache", async () => {
    const user = userEvent.setup();
    const { clearSpy } = renderLayout();

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(clearIdentity).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
  });
});
