import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAgents,
  useCoreMetrics,
  useLearningRecords,
  useNetworks,
  useOrchestrationLog,
  useSimulationState,
  useSwarmStats,
  useTrades,
} from "@/hooks/useQueries";
import {
  formatBlockIndex,
  formatInteger,
  formatKnowledge,
  formatMoney,
  formatPerformance,
  formatPrice,
  formatTokenAmount,
  statusLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { AGENT_SORT_KEYS, AGENT_STATUSES } from "@/types";
import type {
  Agent,
  AgentSortKey,
  AgentStatus,
  LearningRecord,
  Network,
  OrchestrationKind,
  OrchestrationLogEntry,
  TradeRecord,
} from "@/types";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Brain,
  Coins,
  Cpu,
  FlaskConical,
  Gauge,
  GitBranch,
  Layers,
  Network as NetworkIcon,
  Pause,
  Play,
  Radar,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

const STATUS_META: Record<
  AgentStatus,
  { dot: string; glow: string; text: string; ring: string }
> = {
  alive: {
    dot: "bg-state-alive",
    glow: "glow-alive",
    text: "text-state-alive",
    ring: "ring-state-alive/30",
  },
  evolving: {
    dot: "bg-state-evolving",
    glow: "glow-evolving",
    text: "text-state-evolving",
    ring: "ring-state-evolving/30",
  },
  dormant: {
    dot: "bg-state-dormant",
    glow: "glow-dormant",
    text: "text-state-dormant",
    ring: "ring-state-dormant/30",
  },
  extinct: {
    dot: "bg-state-extinct",
    glow: "glow-extinct",
    text: "text-state-extinct",
    ring: "ring-state-extinct/30",
  },
};

const SORT_LABELS: Record<AgentSortKey, string> = {
  money: "Money supply",
  knowledge: "Knowledge",
  generation: "Generation",
  status: "Status",
};

function StatusDot({
  status,
  pulse,
}: { status: AgentStatus; pulse?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        meta.dot,
        meta.glow,
        pulse && "animate-tick-pulse",
      )}
      aria-hidden="true"
    />
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  loading?: boolean;
}) {
  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {value}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background",
            accent,
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

function AgentCard({
  agent,
  index,
  spotlighted,
}: {
  agent: Agent;
  index: number;
  spotlighted: boolean;
}) {
  const meta = STATUS_META[agent.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to="/agents/$agentId"
        params={{ agentId: agent.id.toString() }}
        data-ocid={`agent.card.${index}`}
        className={cn(
          "group relative flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-subtle transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          spotlighted && "border-primary/50 ring-1 ring-primary/40",
        )}
      >
        {spotlighted && (
          <span className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
            <Target className="size-3" />
            Spotlight
          </span>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-xs font-bold text-muted-foreground",
              )}
            >
              #{agent.id.toString()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-foreground">
                {agent.name}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StatusDot
                  status={agent.status}
                  pulse={agent.status === "alive"}
                />
                <span className={cn("font-medium", meta.text)}>
                  {statusLabel(agent.status)}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Coins className="size-3" /> Money
            </p>
            <p className="mt-0.5 truncate font-mono text-sm font-semibold tabular-nums text-state-alive">
              {formatMoney(agent.money)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Brain className="size-3" /> Knowledge
            </p>
            <p className="mt-0.5 truncate font-mono text-sm font-semibold tabular-nums text-state-evolving">
              {formatKnowledge(agent.knowledge)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Layers className="size-3" /> Gen
            </p>
            <p className="mt-0.5 truncate font-mono text-sm font-semibold tabular-nums text-state-dormant">
              {formatInteger(Number(agent.generation))}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function AgentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
        <Card
          key={`skeleton-${n}`}
          className="border-border bg-card shadow-subtle"
        >
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LearningLineagePanel({
  records,
  agents,
  loading,
}: {
  records: LearningRecord[];
  agents: Agent[];
  loading: boolean;
}) {
  const agentName = (id: bigint) =>
    agents.find((a) => a.id === id)?.name ?? `#${id.toString()}`;

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-learn/40 bg-learn/10 text-learn">
            <GitBranch className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Learning Lineage
            </h2>
            <p className="text-xs text-muted-foreground">
              Strategies adopted from higher-performing peers
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((n) => (
              <Skeleton key={`learn-skel-${n}`} className="h-14 w-full" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="dashboard.learning_empty_state"
          >
            <GitBranch className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No strategies adopted yet. Agents learn from peers as the
              simulation evolves.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {records.map((record, i) => (
              <li
                key={record.id.toString()}
                data-ocid={`dashboard.learning.item.${i}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-learn/15 text-learn">
                    <Sparkles className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-foreground">
                      {record.adoptedStrategy.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {record.adoptedStrategy.description}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <Link
                    to="/agents/$agentId"
                    params={{ agentId: record.agentId.toString() }}
                    className="inline-flex items-center gap-1 rounded-md border border-learn/40 bg-learn/10 px-2 py-1 font-medium text-learn transition-colors hover:bg-learn/20"
                    data-ocid={`dashboard.learning.agent.${i}`}
                  >
                    <Users className="size-3" />
                    {agentName(record.agentId)}
                  </Link>
                  <span className="text-muted-foreground">← from</span>
                  <Link
                    to="/agents/$agentId"
                    params={{ agentId: record.sourcePeerId.toString() }}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-muted-foreground transition-colors hover:border-learn hover:text-learn"
                    data-ocid={`dashboard.learning.source.${i}`}
                  >
                    #{record.sourcePeerId.toString()}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TradeLedgerPanel({
  trades,
  agents,
  loading,
}: {
  trades: TradeRecord[];
  agents: Agent[];
  loading: boolean;
}) {
  const agentName = (id: bigint) =>
    agents.find((a) => a.id === id)?.name ?? `#${id.toString()}`;

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-trade-buy/40 bg-trade-buy/10 text-trade-buy">
            <TrendingUp className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Trade History
            </h2>
            <p className="text-xs text-muted-foreground">
              Executed token trades against the ICRC-1 ledger
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((n) => (
              <Skeleton key={`trade-skel-${n}`} className="h-10 w-full" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="dashboard.trades_empty_state"
          >
            <TrendingUp className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No trades executed yet. The treasury begins trading as agents
              coordinate.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table data-ocid="dashboard.trades_table">
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Block</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, i) => (
                  <TableRow
                    key={trade.id.toString()}
                    data-ocid={`dashboard.trade.row.${i}`}
                  >
                    <TableCell className="font-medium text-foreground">
                      {agentName(trade.agentId)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {trade.token}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {formatTokenAmount(trade.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {formatPrice(trade.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 border-transparent",
                          trade.direction === "buy"
                            ? "bg-trade-buy/10 text-trade-buy"
                            : "bg-trade-sell/10 text-trade-sell",
                        )}
                        data-ocid={`dashboard.trade.direction.${i}`}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            trade.direction === "buy"
                              ? "bg-trade-buy"
                              : "bg-trade-sell",
                          )}
                        />
                        {trade.direction === "buy" ? "Buy" : "Sell"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {formatBlockIndex(trade.blockIndex)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NetworksPanel({
  networks,
  agents,
  loading,
}: {
  networks: Network[];
  agents: Agent[];
  loading: boolean;
}) {
  const agentName = (id: bigint) =>
    agents.find((a) => a.id === id)?.name ?? `#${id.toString()}`;

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-network/40 bg-network/10 text-network">
            <NetworkIcon className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Networks
            </h2>
            <p className="text-xs text-muted-foreground">
              Membership and collective performance of shared strategy pools
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1].map((n) => (
              <Skeleton key={`net-skel-${n}`} className="h-20 w-full" />
            ))}
          </div>
        ) : networks.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="dashboard.networks_empty_state"
          >
            <NetworkIcon className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No networks formed yet. Agents cluster into networks as they
              coordinate.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {networks.map((network, i) => (
              <div
                key={network.id.toString()}
                data-ocid={`dashboard.network.item.${i}`}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-network/15 text-network">
                      <NetworkIcon className="size-3.5" />
                    </span>
                    <p className="truncate font-display text-sm font-semibold text-foreground">
                      {network.name}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {network.memberAgentIds.length} members
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {network.memberAgentIds.map((id) => (
                    <Link
                      key={id.toString()}
                      to="/agents/$agentId"
                      params={{ agentId: id.toString() }}
                      className="inline-flex items-center gap-1 rounded-md border border-network/40 bg-network/10 px-2 py-0.5 text-xs font-medium text-network transition-colors hover:bg-network/20"
                      data-ocid={`dashboard.network.member.${i}.${id.toString()}`}
                    >
                      {agentName(id)}
                    </Link>
                  ))}
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium uppercase tracking-wider text-muted-foreground">
                      Collective performance
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-network">
                      {formatPerformance(network.collectivePerformance)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-network transition-all"
                      style={{
                        width: `${Math.min(
                          Math.max(network.collectivePerformance * 100, 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CoreStatusCard({
  metrics,
  loading,
}: {
  metrics: ReturnType<typeof useCoreMetrics>["data"];
  loading: boolean;
}) {
  const coreStatus = metrics?.coreStatus ?? "unknown";
  const statusMeta =
    coreStatus === "active"
      ? {
          dot: "bg-state-alive glow-alive",
          text: "text-state-alive",
          label: "Running",
        }
      : coreStatus === "conserving"
        ? {
            dot: "bg-continuation-conserving glow-continuation-conserving",
            text: "text-continuation-conserving",
            label: "Conserving",
          }
        : {
            dot: "bg-state-dormant glow-dormant",
            text: "text-state-dormant",
            label: "Paused",
          };

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-orchestrate/40 bg-orchestrate/10 text-orchestrate">
            <Cpu className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Evolution Core
            </h2>
            <p className="text-xs text-muted-foreground">
              Self-rewriting rule engine status
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              data-ocid="dashboard.core_status"
            >
              <span
                className={cn("size-3 rounded-full", statusMeta.dot)}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-display text-sm font-semibold",
                    statusMeta.text,
                  )}
                >
                  {statusMeta.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Epoch {metrics?.epoch.toString() ?? "—"}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-background px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Budget spent this epoch
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-budget">
                {metrics
                  ? formatInteger(Number(metrics.budgetState.spent))
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const FEED_KIND_META: Record<
  OrchestrationKind,
  {
    label: string;
    dot: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  observation: {
    label: "Observation",
    dot: "bg-orchestrate",
    text: "text-orchestrate",
    icon: Activity,
  },
  mutation: {
    label: "Mutation",
    dot: "bg-orchestrate-mutate",
    text: "text-orchestrate-mutate",
    icon: Zap,
  },
  trial: {
    label: "Trial",
    dot: "bg-rule-trial",
    text: "text-rule-trial",
    icon: FlaskConical,
  },
  promotion: {
    label: "Promotion",
    dot: "bg-orchestrate-retain",
    text: "text-orchestrate-retain",
    icon: TrendingUp,
  },
  retirement: {
    label: "Retirement",
    dot: "bg-orchestrate-discard",
    text: "text-orchestrate-discard",
    icon: TrendingDown,
  },
};

function OrchestrationFeed({
  entries,
  loading,
}: {
  entries: OrchestrationLogEntry[];
  loading: boolean;
}) {
  const recent = entries.slice(0, 6);

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-orchestrate/40 bg-orchestrate/10 text-orchestrate">
            <Activity className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Orchestration Activity
            </h2>
            <p className="text-xs text-muted-foreground">
              Recent rule mutations and promotions from the evolution core
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={`feed-skel-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="dashboard.orchestration_empty_state"
          >
            <Activity className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No orchestration activity yet. Advance an epoch in the Evolution
              Core.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {recent.map((entry, i) => {
              const meta = FEED_KIND_META[entry.kind];
              const Icon = meta.icon;
              return (
                <li
                  key={`${entry.epoch.toString()}-${i}`}
                  data-ocid={`dashboard.orchestration.item.${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md bg-current/10",
                      meta.text,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide",
                          meta.text,
                        )}
                      >
                        {meta.label}
                      </span>
                      {entry.ruleId !== undefined && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          rule #{entry.ruleId.toString()}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-xs text-foreground">
                      {entry.detail}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    E{entry.epoch.toString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate({ from: "/dashboard" });
  const search = useSearch({ from: "/dashboard" });

  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: stats, isLoading: statsLoading } = useSwarmStats();
  const { data: learningRecords, isLoading: learningLoading } =
    useLearningRecords();
  const { data: trades, isLoading: tradesLoading } = useTrades();
  const { data: networks, isLoading: networksLoading } = useNetworks();
  const { data: coreMetrics, isLoading: coreLoading } = useCoreMetrics();
  const { data: orchestration, isLoading: orchestrationLoading } =
    useOrchestrationLog();
  const { running, spotlightAgentId, pause, resume, reset, setSpotlight } =
    useSimulationState();

  const updateSearch = (patch: Partial<typeof search>) => {
    void navigate({ search: { ...search, ...patch } });
  };

  const toggleDirection = () => {
    updateSearch({ dir: search.dir === "asc" ? "desc" : "asc" });
  };

  const handlePauseResume = () => {
    if (running) {
      pause();
      toast.success("Simulation paused");
    } else {
      resume();
      toast.success("Simulation resumed");
    }
  };

  const handleReset = () => {
    void reset()
      .then(() => toast.success("Swarm reset to a fresh seed population"))
      .catch(() => toast.error("Could not reset the swarm"));
  };

  const handleSpotlight = (value: string) => {
    const id = value === "none" ? null : BigInt(value);
    setSpotlight(id);
    toast.success(
      id === null ? "Spotlight cleared" : "Agent added to spotlight",
    );
  };

  const filtered = (agents ?? []).filter(
    (a) => search.status === "all" || a.status === search.status,
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (search.sort === "status") {
      cmp = a.status.localeCompare(b.status);
    } else if (search.sort === "generation") {
      cmp =
        a.generation < b.generation ? -1 : a.generation > b.generation ? 1 : 0;
    } else {
      cmp = a[search.sort] - b[search.sort];
    }
    return search.dir === "asc" ? cmp : -cmp;
  });

  const hasAgents = (agents?.length ?? 0) > 0;
  const hasFiltered = sorted.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Radar className="size-3.5" />
            Nexus Swarm Control
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            Swarm Command
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Monitor the autonomous agent population, its money supply, and the
            evolution of knowledge across generations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={running ? "secondary" : "default"}
            onClick={handlePauseResume}
            data-ocid="dashboard.simulation_toggle"
          >
            {running ? (
              <>
                <Pause className="size-4" /> Pause
              </>
            ) : (
              <>
                <Play className="size-4" /> Resume
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" data-ocid="dashboard.reset_button">
                <RotateCcw className="size-4" /> Reset swarm
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="dashboard.reset_dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset the swarm?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears the current population and reseeds a fresh set of
                  agents. All current money supply, knowledge, and lineage data
                  will be discarded.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="dashboard.reset_cancel">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  data-ocid="dashboard.reset_confirm"
                >
                  Reset swarm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total money supply"
          value={stats ? formatMoney(stats.totalMoney) : "—"}
          icon={Coins}
          accent="text-state-alive"
          loading={statsLoading}
        />
        <StatCard
          label="Total knowledge"
          value={stats ? formatKnowledge(stats.totalKnowledge) : "—"}
          icon={Brain}
          accent="text-state-evolving"
          loading={statsLoading}
        />
        <StatCard
          label="Active agents"
          value={stats ? formatInteger(Number(stats.activeAgents)) : "—"}
          icon={Users}
          accent="text-state-alive"
          loading={statsLoading}
        />
        <StatCard
          label="Generations evolved"
          value={stats ? formatInteger(Number(stats.generationsEvolved)) : "—"}
          icon={Layers}
          accent="text-state-dormant"
          loading={statsLoading}
        />
        <StatCard
          label="Continuation score"
          value={
            coreMetrics
              ? `${(coreMetrics.currentScore.compositeScore * 100).toFixed(1)}%`
              : "—"
          }
          icon={Gauge}
          accent="text-continuation-healthy"
          loading={coreLoading}
        />
      </div>

      {/* Core status + orchestration feed */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <CoreStatusCard metrics={coreMetrics} loading={coreLoading} />
        <div className="lg:col-span-2">
          <OrchestrationFeed
            entries={orchestration ?? []}
            loading={orchestrationLoading}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-subtle md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Filter
          </span>
          <Select
            value={search.status}
            onValueChange={(v) =>
              updateSearch({ status: v as AgentStatus | "all" })
            }
          >
            <SelectTrigger
              className="w-40"
              data-ocid="dashboard.status_filter"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {AGENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sort
          </span>
          <Select
            value={search.sort}
            onValueChange={(v) => updateSearch({ sort: v as AgentSortKey })}
          >
            <SelectTrigger
              className="w-44"
              data-ocid="dashboard.sort_select"
              aria-label="Sort agents by"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {AGENT_SORT_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleDirection}
            data-ocid="dashboard.sort_direction"
            aria-label={
              search.dir === "asc" ? "Sort ascending" : "Sort descending"
            }
            title={search.dir === "asc" ? "Ascending" : "Descending"}
          >
            {search.dir === "asc" ? (
              <ArrowUp className="size-4" />
            ) : (
              <ArrowDown className="size-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Spotlight
          </span>
          <Select
            value={
              spotlightAgentId === null ? "none" : spotlightAgentId.toString()
            }
            onValueChange={handleSpotlight}
          >
            <SelectTrigger
              className="w-48"
              data-ocid="dashboard.spotlight_select"
              aria-label="Spotlight an agent"
            >
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {(agents ?? []).map((a) => (
                <SelectItem key={a.id.toString()} value={a.id.toString()}>
                  #{a.id.toString()} · {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Agent grid / states */}
      <div className="mt-6">
        {agentsLoading ? (
          <AgentGridSkeleton />
        ) : !hasAgents ? (
          <Card className="border-border bg-card shadow-subtle">
            <CardContent
              className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
              data-ocid="dashboard.empty_state"
            >
              <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                <Sparkles className="size-6" />
              </span>
              <div className="max-w-md">
                <h2 className="font-display text-xl font-bold text-foreground">
                  The swarm is empty
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  No autonomous agents are running yet. Reset the swarm to seed
                  a fresh population and start the simulation.
                </p>
              </div>
              <Button onClick={handleReset} data-ocid="dashboard.start_button">
                <Sparkles className="size-4" /> Seed the swarm
              </Button>
            </CardContent>
          </Card>
        ) : !hasFiltered ? (
          <Card className="border-border bg-card shadow-subtle">
            <CardContent
              className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
              data-ocid="dashboard.no_results_state"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                <Radar className="size-5" />
              </span>
              <div className="max-w-md">
                <h2 className="font-display text-lg font-bold text-foreground">
                  No agents match this filter
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different status or clear the filter to see the full
                  swarm.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => updateSearch({ status: "all" })}
                data-ocid="dashboard.clear_filter_button"
              >
                Clear filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((agent, i) => (
              <AgentCard
                key={agent.id.toString()}
                agent={agent}
                index={i}
                spotlighted={
                  spotlightAgentId !== null && spotlightAgentId === agent.id
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Learning lineage + trade ledger */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LearningLineagePanel
          records={learningRecords ?? []}
          agents={agents ?? []}
          loading={learningLoading}
        />
        <TradeLedgerPanel
          trades={trades ?? []}
          agents={agents ?? []}
          loading={tradesLoading}
        />
      </div>

      {/* Networks */}
      <div className="mt-6">
        <NetworksPanel
          networks={networks ?? []}
          agents={agents ?? []}
          loading={networksLoading}
        />
      </div>
    </div>
  );
}
