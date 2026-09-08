import { Networks } from "@/pages/Networks";
import type { Agent, Network } from "@/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createNetwork = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));
const joinNetwork = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));
const leaveNetwork = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

let mockNetworks: Network[] = [];
let mockAgents: Agent[] = [];

vi.mock("@/hooks/useQueries", () => ({
  useNetworks: () => ({ data: mockNetworks, isLoading: false }),
  useAgents: () => ({ data: mockAgents, isLoading: false }),
  useCreateNetwork: () => createNetwork(),
  useJoinNetwork: () => joinNetwork(),
  useLeaveNetwork: () => leaveNetwork(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: any) => {
    const href = to.replace("$agentId", params?.agentId ?? "");
    return <a href={href}>{children}</a>;
  },
}));

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 1n,
    name: "Alpha",
    money: 500,
    knowledge: 40,
    generation: 0n,
    status: "alive",
    strategy: { name: "Growth", description: "Steady growth" },
    traits: [{ name: "resilience", level: 1n }],
    lineage: { ancestors: [], descendants: [] },
    moneyHistory: [],
    knowledgeTimeline: [],
    ...overrides,
  };
}

describe("Networks", () => {
  beforeEach(() => {
    mockNetworks = [];
    mockAgents = [];
    createNetwork.mockClear();
    joinNetwork.mockClear();
    leaveNetwork.mockClear();
  });

  it("shows an empty state when no networks exist", () => {
    render(<Networks />);

    expect(screen.getByText("No networks yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create a network/i }),
    ).toBeInTheDocument();
  });

  it("creates a network from the create dialog", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    createNetwork.mockReturnValue({ mutate, isPending: false });

    render(<Networks />);
    await user.click(screen.getByRole("button", { name: /create network/i }));

    const dialog = screen.getByTestId("network.create_dialog");
    await user.type(
      within(dialog).getByLabelText(/network name/i),
      "Alpha Syndicate",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /create network/i }),
    );

    expect(mutate).toHaveBeenCalledWith("Alpha Syndicate", expect.anything());
  });

  it("renders a network with its shared strategy pool and collective performance", () => {
    mockAgents = [makeAgent({ id: 1n, name: "Alpha" })];
    mockNetworks = [
      {
        id: 1n,
        name: "Syndicate",
        memberAgentIds: [1n],
        sharedStrategyPool: [{ name: "Growth", description: "Steady growth" }],
        collectivePerformance: 0.6,
      },
    ];
    render(<Networks />);

    expect(screen.getByText("Syndicate")).toBeInTheDocument();
    expect(screen.getByText("1 member")).toBeInTheDocument();
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alpha/i })).toHaveAttribute(
      "href",
      "/agents/1",
    );
  });

  it("offers an available agent to join a network", () => {
    mockAgents = [
      makeAgent({ id: 1n, name: "Alpha" }),
      makeAgent({ id: 2n, name: "Beta" }),
    ];
    mockNetworks = [
      {
        id: 1n,
        name: "Syndicate",
        memberAgentIds: [1n],
        sharedStrategyPool: [],
        collectivePerformance: 0.0,
      },
    ];
    render(<Networks />);

    // The join select is present and enabled because Beta is available.
    const joinSelect = screen.getByRole("combobox", {
      name: /add an agent to syndicate/i,
    });
    expect(joinSelect).toBeInTheDocument();
    expect(joinSelect).not.toBeDisabled();
  });

  it("leaves a network by removing a member agent", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    leaveNetwork.mockReturnValue({ mutate, isPending: false });

    mockAgents = [makeAgent({ id: 1n, name: "Alpha" })];
    mockNetworks = [
      {
        id: 1n,
        name: "Syndicate",
        memberAgentIds: [1n],
        sharedStrategyPool: [],
        collectivePerformance: 0.0,
      },
    ];
    render(<Networks />);

    await user.click(
      screen.getByRole("button", { name: /remove alpha from syndicate/i }),
    );

    expect(mutate).toHaveBeenCalledWith(
      { networkId: 1n, agentId: 1n },
      expect.anything(),
    );
  });
});
