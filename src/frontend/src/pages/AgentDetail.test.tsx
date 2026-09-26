import { AgentDetail } from "@/pages/AgentDetail";
import type {
  Agent,
  LearningRecord,
  Network,
  RuleRecord,
  TradeRecord,
} from "@/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setSpotlight = vi.fn();
let mockAgent: Agent | null = null;
let mockIsLoading = false;
let mockSpotlight: bigint | null = null;
let mockLearning: LearningRecord[] = [];
let mockTrades: TradeRecord[] = [];
let mockNetworks: Network[] = [];
let mockRules: RuleRecord[] = [];

vi.mock("@/hooks/useQueries", () => ({
  useAgent: () => ({ data: mockAgent, isLoading: mockIsLoading }),
  useAgentLearning: () => ({ data: mockLearning, isLoading: false }),
  useAgentTrades: () => ({ data: mockTrades, isLoading: false }),
  useNetworks: () => ({ data: mockNetworks, isLoading: false }),
  useRules: () => ({ data: mockRules, isLoading: false }),
  useSimulationState: () => ({
    spotlightAgentId: mockSpotlight,
    setSpotlight,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: any) => {
    const href = to.replace("$agentId", params?.agentId ?? "");
    return <a href={href}>{children}</a>;
  },
  useParams: () => ({ agentId: "1" }),
}));

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 1n,
    name: "Alpha",
    money: 500,
    knowledge: 40,
    generation: 2n,
    status: "alive",
    strategy: { name: "Growth", description: "Steady growth" },
    traits: [{ name: "resilience", level: 1n }],
    lineage: { ancestors: [], descendants: [] },
    moneyHistory: [
      { tick: 0n, money: 100, at: 0n },
      { tick: 1n, money: 300, at: 1n },
    ],
    knowledgeTimeline: [
      { tick: 0n, knowledge: 10, at: 0n },
      { tick: 1n, knowledge: 40, at: 1n },
    ],
    ...overrides,
  };
}

describe("AgentDetail", () => {
  beforeEach(() => {
    mockAgent = makeAgent();
    mockIsLoading = false;
    mockSpotlight = null;
    mockLearning = [];
    mockTrades = [];
    mockNetworks = [];
    mockRules = [];
    setSpotlight.mockClear();
  });

  it("renders the agent's full profile with strategy and traits", () => {
    render(<AgentDetail />);

    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("Steady growth")).toBeInTheDocument();
    expect(screen.getByText("resilience")).toBeInTheDocument();
    expect(screen.getByText("Lv 1")).toBeInTheDocument();
  });

  it("renders money supply history and knowledge growth timeline charts", () => {
    render(<AgentDetail />);

    expect(screen.getByText("Money supply history")).toBeInTheDocument();
    expect(screen.getByText("Knowledge growth timeline")).toBeInTheDocument();
    expect(screen.getByTestId("agent.chart.money")).toBeInTheDocument();
    expect(screen.getByTestId("agent.chart.knowledge")).toBeInTheDocument();
  });

  it("renders evolution lineage with ancestors and descendants", () => {
    mockAgent = makeAgent({
      lineage: { ancestors: [0n], descendants: [4n, 5n] },
    });
    render(<AgentDetail />);

    expect(screen.getByText("Ancestors")).toBeInTheDocument();
    expect(screen.getByText("Descendants")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /#0/ })).toHaveAttribute(
      "href",
      "/agents/0",
    );
    expect(screen.getByRole("link", { name: /#4/ })).toHaveAttribute(
      "href",
      "/agents/4",
    );
    expect(screen.getByRole("link", { name: /#5/ })).toHaveAttribute(
      "href",
      "/agents/5",
    );
  });

  it("shows empty lineage labels for a root agent", () => {
    render(<AgentDetail />);

    expect(
      screen.getByText("This agent is a root — it has no ancestors."),
    ).toBeInTheDocument();
    expect(screen.getByText("No descendants evolved yet.")).toBeInTheDocument();
  });

  it("shows an error state when the agent is not found", () => {
    mockAgent = null;
    render(<AgentDetail />);

    expect(screen.getByText("Agent not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("follows and unfollows an agent's evolution via spotlight", async () => {
    const user = userEvent.setup();
    render(<AgentDetail />);

    await user.click(screen.getByRole("button", { name: /follow evolution/i }));
    expect(setSpotlight).toHaveBeenCalledWith(1n);

    mockSpotlight = 1n;
    render(<AgentDetail />);
    await user.click(
      screen.getByRole("button", { name: /following evolution/i }),
    );
    expect(setSpotlight).toHaveBeenCalledWith(null);
  });

  it("renders the agent's learning lineage with source peer and weight", () => {
    mockLearning = [
      {
        id: 1n,
        agentId: 1n,
        sourcePeerId: 2n,
        adoptedStrategy: { name: "Momentum", description: "Ride the trend" },
        integrationWeight: 0.5,
        at: 0n,
      },
    ];
    render(<AgentDetail />);

    expect(screen.getByText("Learning lineage")).toBeInTheDocument();
    expect(screen.getByText("Momentum")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /#2/ })).toHaveAttribute(
      "href",
      "/agents/2",
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows an empty learning lineage for an agent that has not learned", () => {
    render(<AgentDetail />);

    expect(screen.getByText("Learning lineage")).toBeInTheDocument();
    expect(
      screen.getByText(/No strategies adopted from peers yet/i),
    ).toBeInTheDocument();
  });

  it("renders the agent's trade history with token, direction and block", () => {
    mockTrades = [
      {
        id: 1n,
        agentId: 1n,
        token: "ckBTC",
        amount: 0.25,
        price: 62000,
        direction: "sell",
        blockIndex: 99n,
        at: 0n,
      },
    ];
    render(<AgentDetail />);

    expect(screen.getByText("Trade history")).toBeInTheDocument();
    expect(screen.getByText("ckBTC")).toBeInTheDocument();
    expect(screen.getByText("sell")).toBeInTheDocument();
    expect(screen.getByText("0.25")).toBeInTheDocument();
    expect(screen.getByText("$62,000.00")).toBeInTheDocument();
    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("shows an empty trade history for an agent that has not traded", () => {
    render(<AgentDetail />);

    expect(screen.getByText("Trade history")).toBeInTheDocument();
    expect(
      screen.getByText(/No trades executed by this agent yet/i),
    ).toBeInTheDocument();
  });

  it("renders the networks this agent belongs to with collective performance", () => {
    mockNetworks = [
      {
        id: 1n,
        name: "Syndicate",
        memberAgentIds: [1n],
        sharedStrategyPool: [{ name: "Growth", description: "Steady growth" }],
        collectivePerformance: 0.8,
      },
    ];
    render(<AgentDetail />);

    expect(screen.getByText("Networks")).toBeInTheDocument();
    expect(screen.getByText("Syndicate")).toBeInTheDocument();
    expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
  });

  it("shows that an agent is not a member of any network", () => {
    render(<AgentDetail />);

    expect(screen.getByText("Networks")).toBeInTheDocument();
    expect(
      screen.getByText(/This agent is not a member of any network yet/i),
    ).toBeInTheDocument();
  });

  it("renders the rule versions governing the agent's behavior", () => {
    mockRules = [
      {
        id: 1n,
        domain: "Growth",
        body: "if reserves > 0.5 then invest",
        version: 2n,
        parent: 0n,
        status: "active",
        contribution: 0.12,
        createdEpoch: 1n,
      },
    ];
    render(<AgentDetail />);

    const ruleItem = screen.getByTestId("agent.rule.item.0");
    expect(screen.getByText("Governing rules")).toBeInTheDocument();
    expect(within(ruleItem).getByText("Growth")).toBeInTheDocument();
    expect(
      within(ruleItem).getByText("if reserves > 0.5 then invest"),
    ).toBeInTheDocument();
    expect(within(ruleItem).getByText("v2 · E1")).toBeInTheDocument();
    expect(within(ruleItem).getByText("Active")).toBeInTheDocument();
    expect(within(ruleItem).getByText("+12.0%")).toBeInTheDocument();
  });

  it("shows an empty governing-rules state when no rules are registered", () => {
    render(<AgentDetail />);

    expect(screen.getByText("Governing rules")).toBeInTheDocument();
    expect(
      screen.getByText(/No governing rules registered yet/i),
    ).toBeInTheDocument();
  });
});
