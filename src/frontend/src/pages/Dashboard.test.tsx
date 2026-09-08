import { Dashboard } from "@/pages/Dashboard";
import type {
  Agent,
  AgentSortKey,
  AgentStatus,
  LearningRecord,
  Network,
  SwarmStats,
  TradeRecord,
} from "@/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
const pause = vi.fn();
const resume = vi.fn();
const reset = vi.fn(() => Promise.resolve());
const setSpotlight = vi.fn();

let mockAgents: Agent[] = [];
let mockStats: SwarmStats | undefined;
let mockLearning: LearningRecord[] = [];
let mockTrades: TradeRecord[] = [];
let mockNetworks: Network[] = [];
let mockRunning = true;
let mockSpotlight: bigint | null = null;
let mockSearch: {
  sort: AgentSortKey;
  dir: "asc" | "desc";
  status: AgentStatus | "all";
} = { sort: "money", dir: "desc", status: "all" };

vi.mock("@/hooks/useQueries", () => ({
  useAgents: () => ({ data: mockAgents, isLoading: false }),
  useSwarmStats: () => ({ data: mockStats, isLoading: false }),
  useLearningRecords: () => ({ data: mockLearning, isLoading: false }),
  useTrades: () => ({ data: mockTrades, isLoading: false }),
  useNetworks: () => ({ data: mockNetworks, isLoading: false }),
  useSimulationState: () => ({
    running: mockRunning,
    spotlightAgentId: mockSpotlight,
    pause,
    resume,
    reset,
    setSpotlight,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: any) => {
    const href = to.replace("$agentId", params?.agentId ?? "");
    return <a href={href}>{children}</a>;
  },
  useNavigate: () => navigate,
  useSearch: () => mockSearch,
}));

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 1n,
    name: "Agent 1",
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

describe("Dashboard", () => {
  beforeEach(() => {
    mockAgents = [];
    mockStats = undefined;
    mockLearning = [];
    mockTrades = [];
    mockNetworks = [];
    mockRunning = true;
    mockSpotlight = null;
    mockSearch = { sort: "money", dir: "desc", status: "all" };
    navigate.mockClear();
    pause.mockClear();
    resume.mockClear();
    reset.mockClear();
    setSpotlight.mockClear();
  });

  it("renders aggregate swarm stats", () => {
    mockStats = {
      totalMoney: 1500,
      totalKnowledge: 120,
      activeAgents: 3n,
      generationsEvolved: 2n,
      tick: 5n,
    };
    render(<Dashboard />);

    expect(screen.getByText("Total money supply")).toBeInTheDocument();
    expect(screen.getByText("Total knowledge")).toBeInTheDocument();
    expect(screen.getByText("Active agents")).toBeInTheDocument();
    expect(screen.getByText("Generations evolved")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders the agent swarm with live money and knowledge values", () => {
    mockAgents = [
      makeAgent({ id: 1n, name: "Alpha", money: 500, knowledge: 40 }),
      makeAgent({ id: 2n, name: "Beta", money: 900, knowledge: 60 }),
    ];
    render(<Dashboard />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByText("$900")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("links each agent card to its detail view", () => {
    mockAgents = [makeAgent({ id: 7n, name: "Gamma" })];
    render(<Dashboard />);

    const link = screen.getByRole("link", { name: /gamma/i });
    expect(link).toHaveAttribute("href", "/agents/7");
  });

  it("shows an empty state guiding the user to seed the swarm", () => {
    render(<Dashboard />);

    expect(screen.getByText("The swarm is empty")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /seed the swarm/i }),
    ).toBeInTheDocument();
  });

  it("shows a no-results state when the filter matches nothing", () => {
    mockAgents = [makeAgent({ status: "alive" })];
    mockSearch = { sort: "money", dir: "desc", status: "extinct" };
    render(<Dashboard />);

    expect(screen.getByText("No agents match this filter")).toBeInTheDocument();
  });

  it("filters agents by status", () => {
    mockAgents = [
      makeAgent({ id: 1n, name: "AliveOne", status: "alive" }),
      makeAgent({ id: 2n, name: "ExtinctOne", status: "extinct" }),
    ];
    mockSearch = { sort: "money", dir: "desc", status: "extinct" };
    render(<Dashboard />);

    expect(screen.getByText("ExtinctOne")).toBeInTheDocument();
    expect(screen.queryByText("AliveOne")).not.toBeInTheDocument();
  });

  it("sorts agents by money supply descending by default", () => {
    mockAgents = [
      makeAgent({ id: 1n, name: "Low", money: 100 }),
      makeAgent({ id: 2n, name: "High", money: 900 }),
    ];
    render(<Dashboard />);

    const cards = screen.getAllByRole("link");
    // The two agent cards appear in descending money order.
    expect(cards[0]).toHaveTextContent("High");
    expect(cards[1]).toHaveTextContent("Low");
  });

  it("toggles sort direction through the URL search state", async () => {
    const user = userEvent.setup();
    mockAgents = [makeAgent()];
    render(<Dashboard />);

    await user.click(screen.getByRole("button", { name: /sort descending/i }));
    expect(navigate).toHaveBeenCalledWith({
      search: { sort: "money", dir: "asc", status: "all" },
    });
  });

  it("pauses and resumes the simulation", async () => {
    const user = userEvent.setup();
    mockAgents = [makeAgent()];
    mockRunning = true;
    render(<Dashboard />);

    await user.click(screen.getByRole("button", { name: /pause/i }));
    expect(pause).toHaveBeenCalled();

    mockRunning = false;
    render(<Dashboard />);
    await user.click(screen.getByRole("button", { name: /resume/i }));
    expect(resume).toHaveBeenCalled();
  });

  it("resets the swarm from the reset dialog", async () => {
    const user = userEvent.setup();
    mockAgents = [makeAgent()];
    render(<Dashboard />);

    await user.click(screen.getByRole("button", { name: /reset swarm/i }));
    const dialog = screen.getByTestId("dashboard.reset_dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /reset swarm/i }),
    );
    expect(reset).toHaveBeenCalled();
  });

  it("marks the spotlighted agent on its card", () => {
    mockAgents = [makeAgent({ id: 3n, name: "Spot" })];
    mockSpotlight = 3n;
    render(<Dashboard />);

    const card = screen.getByRole("link", { name: /spot/i });
    expect(within(card).getByText("Spotlight")).toBeInTheDocument();
  });

  it("shows the learning lineage of adopted strategies from peers", () => {
    mockAgents = [
      makeAgent({ id: 1n, name: "Learner" }),
      makeAgent({ id: 2n, name: "Mentor" }),
    ];
    mockLearning = [
      {
        id: 1n,
        agentId: 1n,
        sourcePeerId: 2n,
        adoptedStrategy: { name: "Momentum", description: "Ride the trend" },
        integrationWeight: 0.6,
        at: 0n,
      },
    ];
    render(<Dashboard />);

    expect(screen.getByText("Learning Lineage")).toBeInTheDocument();
    expect(screen.getByText("Momentum")).toBeInTheDocument();
    expect(screen.getByText("Ride the trend")).toBeInTheDocument();
    // The adopting agent links to its detail view (scoped to the learning item).
    const learningItem = screen.getByTestId("dashboard.learning.item.0");
    expect(
      within(learningItem).getByRole("link", { name: /learner/i }),
    ).toHaveAttribute("href", "/agents/1");
    // The source peer is shown by id.
    expect(
      within(learningItem).getByRole("link", { name: /#2/ }),
    ).toHaveAttribute("href", "/agents/2");
  });

  it("shows an empty state when no strategies have been adopted", () => {
    render(<Dashboard />);

    expect(screen.getByText("Learning Lineage")).toBeInTheDocument();
    expect(screen.getByText(/No strategies adopted yet/i)).toBeInTheDocument();
  });

  it("renders the trade ledger with token, amount, price, direction and block", () => {
    mockAgents = [makeAgent({ id: 1n, name: "Trader" })];
    mockTrades = [
      {
        id: 1n,
        agentId: 1n,
        token: "ICP",
        amount: 12.5,
        price: 8.4,
        direction: "buy",
        blockIndex: 123456n,
        at: 0n,
      },
    ];
    render(<Dashboard />);

    expect(screen.getByText("Trade History")).toBeInTheDocument();
    expect(screen.getByText("ICP")).toBeInTheDocument();
    expect(screen.getByText("12.5")).toBeInTheDocument();
    expect(screen.getByText("$8.40")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText("123,456")).toBeInTheDocument();
  });

  it("shows an empty state when no trades have been executed", () => {
    render(<Dashboard />);

    expect(screen.getByText("Trade History")).toBeInTheDocument();
    expect(screen.getByText(/No trades executed yet/i)).toBeInTheDocument();
  });

  it("renders networks with membership and collective performance", () => {
    mockAgents = [makeAgent({ id: 1n, name: "Alpha" })];
    mockNetworks = [
      {
        id: 1n,
        name: "Syndicate",
        memberAgentIds: [1n],
        sharedStrategyPool: [{ name: "Growth", description: "Steady growth" }],
        collectivePerformance: 0.75,
      },
    ];
    render(<Dashboard />);

    expect(screen.getByText("Networks")).toBeInTheDocument();
    expect(screen.getByText("Syndicate")).toBeInTheDocument();
    expect(screen.getByText("1 members")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    const networkItem = screen.getByTestId("dashboard.network.item.0");
    expect(
      within(networkItem).getByRole("link", { name: /alpha/i }),
    ).toHaveAttribute("href", "/agents/1");
  });

  it("shows an empty state when no networks have formed", () => {
    render(<Dashboard />);

    expect(screen.getByText("Networks")).toBeInTheDocument();
    expect(screen.getByText(/No networks formed yet/i)).toBeInTheDocument();
  });
});
