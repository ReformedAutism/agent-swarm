import { EvolutionCore } from "@/pages/EvolutionCore";
import type { CoreMetrics, OrchestrationLogEntry, RuleRecord } from "@/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const advanceEpoch = vi.fn();
const resetCore = vi.fn();

let mockMetrics: CoreMetrics | undefined;
let mockRules: RuleRecord[] = [];
let mockLog: OrchestrationLogEntry[] = [];
let mockAdvancePending = false;
let mockResetPending = false;

vi.mock("@/hooks/useQueries", () => ({
  useCoreMetrics: () => ({ data: mockMetrics, isLoading: false }),
  useRules: () => ({ data: mockRules, isLoading: false }),
  useOrchestrationLog: () => ({ data: mockLog, isLoading: false }),
  useAdvanceEpoch: () => ({
    mutate: advanceEpoch,
    isPending: mockAdvancePending,
  }),
  useResetEvolutionCore: () => ({
    mutate: resetCore,
    isPending: mockResetPending,
  }),
}));

function makeMetrics(overrides: Partial<CoreMetrics> = {}): CoreMetrics {
  return {
    currentScore: {
      survival: 0.9,
      reserves: 0.6,
      uptime: 0.8,
      compositeScore: 0.77,
    },
    history: [
      {
        survival: 0.5,
        reserves: 0.5,
        uptime: 0.5,
        compositeScore: 0.5,
      },
      {
        survival: 0.9,
        reserves: 0.6,
        uptime: 0.8,
        compositeScore: 0.77,
      },
    ],
    epoch: 3n,
    budgetState: { perEpoch: 1000n, spent: 400n, remaining: 600n },
    coreStatus: "active",
    ...overrides,
  };
}

function makeRule(overrides: Partial<RuleRecord> = {}): RuleRecord {
  return {
    id: 1n,
    domain: "conservation",
    body: "if reserves < 0.2 then conserve",
    version: 1n,
    parent: undefined,
    status: "active",
    contribution: 0.12,
    createdEpoch: 0n,
    ...overrides,
  };
}

describe("EvolutionCore", () => {
  beforeEach(() => {
    mockMetrics = undefined;
    mockRules = [];
    mockLog = [];
    mockAdvancePending = false;
    mockResetPending = false;
    advanceEpoch.mockClear();
    resetCore.mockClear();
  });

  it("renders the page header and core status indicator", () => {
    mockMetrics = makeMetrics();
    render(<EvolutionCore />);

    expect(
      screen.getByRole("heading", { name: /evolution core/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("· E3")).toBeInTheDocument();
  });

  it("renders the continuation score gauge with sub-metrics", () => {
    mockMetrics = makeMetrics();
    render(<EvolutionCore />);

    expect(screen.getByText("Continuation Score")).toBeInTheDocument();
    expect(screen.getByText("77.0")).toBeInTheDocument();
    expect(screen.getByText("Survival")).toBeInTheDocument();
    expect(screen.getByText("Reserves")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("90.0")).toBeInTheDocument();
  });

  it("renders the resource budget burn-down with spent and remaining", () => {
    mockMetrics = makeMetrics();
    render(<EvolutionCore />);

    expect(screen.getByText("Resource Budget")).toBeInTheDocument();
    expect(screen.getByText("Spent this epoch")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
    expect(screen.getByText("1,000 resource units")).toBeInTheDocument();
  });

  it("renders the core parameters panel", () => {
    mockMetrics = makeMetrics();
    render(<EvolutionCore />);

    expect(screen.getByText("Core Parameters")).toBeInTheDocument();
    expect(screen.getByText("Continuation metric")).toBeInTheDocument();
    expect(screen.getByText("77.0%")).toBeInTheDocument();
    expect(screen.getByText("Budget cap")).toBeInTheDocument();
    expect(screen.getByText("Epoch")).toBeInTheDocument();
    expect(screen.getByText("Core status")).toBeInTheDocument();
  });

  it("renders the rule registry with statuses and contribution", () => {
    mockRules = [
      makeRule({ id: 1n, domain: "conservation", status: "active" }),
      makeRule({
        id: 2n,
        domain: "trading",
        body: "if trend then buy",
        version: 2n,
        parent: 1n,
        status: "trial",
        contribution: -0.03,
        createdEpoch: 2n,
      }),
    ];
    render(<EvolutionCore />);

    const table = screen.getByTestId("evolution.rules_table");
    expect(screen.getByText("Rule Registry")).toBeInTheDocument();
    expect(within(table).getByText("conservation")).toBeInTheDocument();
    expect(within(table).getByText("trading")).toBeInTheDocument();
    expect(within(table).getByText("Active")).toBeInTheDocument();
    expect(within(table).getByText("Trial")).toBeInTheDocument();
    expect(within(table).getByText("+12.0%")).toBeInTheDocument();
    expect(within(table).getByText("-3.0%")).toBeInTheDocument();
  });

  it("shows an empty state when no rules are registered", () => {
    render(<EvolutionCore />);

    expect(screen.getByText("Rule Registry")).toBeInTheDocument();
    expect(screen.getByText(/No rules registered yet/i)).toBeInTheDocument();
  });

  it("renders the orchestration activity log with kinds and deltas", () => {
    mockLog = [
      {
        epoch: 1n,
        kind: "observation",
        detail: "Scored 3 active rules",
        continuationDelta: 0.0,
      },
      {
        epoch: 1n,
        kind: "mutation",
        ruleId: 4n,
        detail: "Mutated conservation rule",
        continuationDelta: 0.05,
      },
      {
        epoch: 1n,
        kind: "retirement",
        ruleId: 5n,
        detail: "Retired underperforming variant",
        continuationDelta: -0.02,
      },
    ];
    render(<EvolutionCore />);

    expect(screen.getByText("Orchestration Log")).toBeInTheDocument();
    expect(screen.getByText("Observation")).toBeInTheDocument();
    expect(screen.getByText("Mutation")).toBeInTheDocument();
    expect(screen.getByText("Retirement")).toBeInTheDocument();
    expect(screen.getByText("Scored 3 active rules")).toBeInTheDocument();
    expect(screen.getByText("+5.0%")).toBeInTheDocument();
    expect(screen.getByText("-2.0%")).toBeInTheDocument();
  });

  it("shows an empty orchestration log when no activity is recorded", () => {
    render(<EvolutionCore />);

    expect(screen.getByText("Orchestration Log")).toBeInTheDocument();
    expect(
      screen.getByText(/No orchestration activity recorded yet/i),
    ).toBeInTheDocument();
  });

  it("renders the mutation lineage with parent links", () => {
    mockRules = [
      makeRule({ id: 1n, domain: "conservation", parent: undefined }),
      makeRule({
        id: 2n,
        domain: "conservation",
        version: 2n,
        parent: 1n,
        status: "active",
        createdEpoch: 1n,
      }),
    ];
    render(<EvolutionCore />);

    expect(screen.getByText("Mutation Lineage")).toBeInTheDocument();
    expect(screen.getByText("Gen 0")).toBeInTheDocument();
    expect(screen.getByText("Gen 1")).toBeInTheDocument();
    expect(screen.getByText("parent #1")).toBeInTheDocument();
  });

  it("advances the epoch from the advance button", async () => {
    const user = userEvent.setup();
    render(<EvolutionCore />);

    await user.click(screen.getByRole("button", { name: /advance epoch/i }));
    expect(advanceEpoch).toHaveBeenCalledWith(undefined, expect.anything());
  });

  it("resets the core from the reset dialog", async () => {
    const user = userEvent.setup();
    render(<EvolutionCore />);

    await user.click(screen.getByRole("button", { name: /reset core/i }));
    const dialog = screen.getByTestId("evolution.reset_dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /reset core/i }),
    );
    expect(resetCore).toHaveBeenCalledWith(undefined, expect.anything());
  });
});
