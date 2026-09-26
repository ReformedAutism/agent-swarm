import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAgent,
  useAgentLearning,
  useAgentTrades,
  useNetworks,
  useRules,
  useSimulationState,
} from "@/hooks/useQueries";
import {
  formatBlockIndex,
  formatDate,
  formatKnowledge,
  formatMoney,
  formatPerformance,
  formatPrice,
  formatTokenAmount,
  statusLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AgentStatus,
  LearningRecord,
  RuleRecord,
  RuleStatus,
  TradeRecord,
} from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Braces,
  Brain,
  CircleDot,
  Coins,
  GitBranch,
  Layers,
  Network as NetworkIcon,
  Radar,
  Sparkles,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const STATUS_STYLES: Record<
  AgentStatus,
  { dot: string; text: string; badge: string }
> = {
  alive: {
    dot: "bg-state-alive glow-alive",
    text: "text-state-alive",
    badge: "border-state-alive/40 bg-state-alive/10 text-state-alive",
  },
  evolving: {
    dot: "bg-state-evolving glow-evolving",
    text: "text-state-evolving",
    badge: "border-state-evolving/40 bg-state-evolving/10 text-state-evolving",
  },
  dormant: {
    dot: "bg-state-dormant glow-dormant",
    text: "text-state-dormant",
    badge: "border-state-dormant/40 bg-state-dormant/10 text-state-dormant",
  },
  extinct: {
    dot: "bg-state-extinct glow-extinct",
    text: "text-state-extinct",
    badge: "border-state-extinct/40 bg-state-extinct/10 text-state-extinct",
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md border",
            accent,
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate font-mono text-xl font-semibold tabular-nums">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LineageCard({
  title,
  ids,
  emptyLabel,
  accent,
}: {
  title: string;
  ids: bigint[];
  emptyLabel: string;
  accent: string;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5 py-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <GitBranch className={cn("size-4", accent)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        {ids.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ids.map((id) => (
              <Link
                key={id.toString()}
                to="/agents/$agentId"
                params={{ agentId: id.toString() }}
                data-ocid={`agent.lineage.link.${id.toString()}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <CircleDot className="size-3 text-muted-foreground" />#
                {id.toString()}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LearningLineageCard({
  records,
  loading,
}: {
  records: LearningRecord[];
  loading: boolean;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5 py-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <GitBranch className="size-4 text-learn" />
          Learning lineage
        </CardTitle>
        <CardDescription>
          Strategies this agent adopted from higher-performing peers.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={`learn-skel-${i}`} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No strategies adopted from peers yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {records.map((record, index) => (
              <li
                key={record.id.toString()}
                className="flex items-center gap-3 rounded-lg border border-learn/25 bg-learn/5 p-3"
                data-ocid={`agent.learning.item.${index}`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-learn/40 bg-learn/10 text-learn glow-learn">
                  <ArrowDownRight className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {record.adoptedStrategy.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>
                      from{" "}
                      <Link
                        to="/agents/$agentId"
                        params={{ agentId: record.sourcePeerId.toString() }}
                        data-ocid={`agent.learning.source.${index}`}
                        className="font-mono font-medium text-learn transition-colors hover:underline"
                      >
                        #{record.sourcePeerId.toString()}
                      </Link>
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span>{formatDate(record.at)}</span>
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-learn/30 bg-learn/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-learn">
                  {formatPerformance(record.integrationWeight)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TradeHistoryCard({
  trades,
  loading,
}: {
  trades: TradeRecord[];
  loading: boolean;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5 py-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Coins className="size-4 text-trade-buy" />
          Trade history
        </CardTitle>
        <CardDescription>
          Executed token trades recorded against the ICRC-1 ledger.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={`trade-skel-${i}`} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No trades executed by this agent yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Token</th>
                  <th className="py-2 pr-3 font-medium">Direction</th>
                  <th className="py-2 pr-3 text-right font-medium">Amount</th>
                  <th className="py-2 pr-3 text-right font-medium">Price</th>
                  <th className="py-2 pr-3 text-right font-medium">Block</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => {
                  const isBuy = trade.direction === "buy";
                  return (
                    <tr
                      key={trade.id.toString()}
                      className="border-b border-border/60 last:border-0"
                      data-ocid={`agent.trade.row.${index}`}
                    >
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isBuy ? "bg-trade-buy" : "bg-trade-sell",
                            )}
                          />
                          {trade.token}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase",
                            isBuy ? "text-trade-buy" : "text-trade-sell",
                          )}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowDownRight className="size-3.5" />
                          )}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-foreground">
                        {formatTokenAmount(trade.amount)}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatPrice(trade.price)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatBlockIndex(trade.blockIndex)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NetworksCard({
  networks,
  agentId,
  loading,
}: {
  networks: ReturnType<typeof useNetworks>["data"];
  agentId: bigint;
  loading: boolean;
}) {
  const memberNetworks = (networks ?? []).filter((n) =>
    n.memberAgentIds.includes(agentId),
  );

  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5 py-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <NetworkIcon className="size-4 text-network" />
          Networks
        </CardTitle>
        <CardDescription>
          Networks this agent belongs to and their collective performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={`net-skel-${i}`} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : memberNetworks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This agent is not a member of any network yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {memberNetworks.map((network, index) => (
              <li
                key={network.id.toString()}
                className="rounded-lg border border-network/25 bg-network/5 p-3"
                data-ocid={`agent.network.item.${index}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-network/40 bg-network/10 text-network glow-network">
                      <Users className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-foreground">
                        {network.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {network.memberAgentIds.length} member
                        {network.memberAgentIds.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-network">
                    {formatPerformance(network.collectivePerformance)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span>Collective performance</span>
                    <span className="font-mono text-network">
                      {formatPerformance(network.collectivePerformance)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-network transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, network.collectivePerformance * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {network.sharedStrategyPool.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-network/15 pt-3">
                    {network.sharedStrategyPool.map((strategy) => (
                      <span
                        key={strategy.name}
                        className="rounded-full border border-network/30 bg-network/10 px-2 py-0.5 text-[10px] font-medium text-network"
                      >
                        {strategy.name}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryChart({
  title,
  description,
  data,
  color,
  formatter,
  dataKey,
}: {
  title: string;
  description: string;
  data: { index: string; value: number }[];
  color: string;
  formatter: (value: number) => string;
  dataKey: string;
}) {
  const config = {
    [dataKey]: { label: title, color },
  };

  if (data.length === 0) {
    return (
      <Card className="gap-3 py-5">
        <CardHeader className="px-5 py-0">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-5">
          <p className="text-sm text-muted-foreground">
            No history recorded yet for this agent.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5 py-0">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <ChartContainer
          config={config}
          className="aspect-[16/6] w-full"
          data-ocid={`agent.chart.${dataKey}`}
        >
          <AreaChart
            data={data}
            margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`fill-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) => `T${v}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => formatter(v)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Tick ${label}`}
                  formatter={(value) => formatter(Number(value))}
                />
              }
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${dataKey})`}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const RULE_STATUS_META: Record<
  RuleStatus,
  { label: string; badge: string; dot: string }
> = {
  active: {
    label: "Active",
    badge: "border-rule-active/40 bg-rule-active/10 text-rule-active",
    dot: "bg-rule-active",
  },
  trial: {
    label: "Trial",
    badge: "border-rule-trial/40 bg-rule-trial/10 text-rule-trial",
    dot: "bg-rule-trial",
  },
  retired: {
    label: "Retired",
    badge: "border-rule-retired/40 bg-rule-retired/10 text-rule-retired",
    dot: "bg-rule-retired",
  },
};

function GoverningRulesCard({
  rules,
  domain,
  loading,
}: {
  rules: RuleRecord[];
  domain: string;
  loading: boolean;
}) {
  const normalized = domain.trim().toLowerCase();
  const governing = rules.filter(
    (rule) =>
      rule.domain.trim().toLowerCase() === normalized ||
      rule.domain.trim().toLowerCase().includes(normalized) ||
      normalized.includes(rule.domain.trim().toLowerCase()),
  );
  const shown = governing.length > 0 ? governing : rules;

  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5 py-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Braces className="size-4 text-rule-active" />
          Governing rules
        </CardTitle>
        <CardDescription>
          Rule versions from the evolution core that govern this agent's{" "}
          {domain} behavior.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={`rule-skel-${i}`} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No governing rules registered yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {shown.map((rule, index) => {
              const meta = RULE_STATUS_META[rule.status];
              const positive = rule.contribution >= 0;
              return (
                <li
                  key={rule.id.toString()}
                  className="rounded-lg border border-rule-active/25 bg-rule-active/5 p-3"
                  data-ocid={`agent.rule.item.${index}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-rule-active/40 bg-rule-active/10 font-mono text-xs font-bold text-rule-active">
                        #{rule.id.toString()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-semibold text-foreground">
                          {rule.domain}
                        </p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          v{rule.version.toString()} · E
                          {rule.createdEpoch.toString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("gap-1.5 border-transparent", meta.badge)}
                      data-ocid={`agent.rule.status.${index}`}
                    >
                      <span className={cn("size-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                    {rule.body}
                  </p>
                  <div className="mt-2 flex items-center justify-between border-t border-rule-active/15 pt-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Contribution
                    </span>
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold tabular-nums",
                        positive ? "text-trade-buy" : "text-trade-sell",
                      )}
                    >
                      {positive ? "+" : ""}
                      {(rule.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AgentDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={`stat-${i}`} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-1" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

export function AgentDetail() {
  const { agentId } = useParams({ from: "/agents/$agentId" });
  const id = BigInt(agentId);
  const { data: agent, isLoading } = useAgent(id);
  const { data: learning, isLoading: learningLoading } = useAgentLearning(id);
  const { data: trades, isLoading: tradesLoading } = useAgentTrades(id);
  const { data: networks, isLoading: networksLoading } = useNetworks();
  const { data: rules, isLoading: rulesLoading } = useRules();
  const { spotlightAgentId, setSpotlight } = useSimulationState();

  const isSpotlighted = spotlightAgentId === id;

  if (isLoading) {
    return <AgentDetailSkeleton />;
  }

  if (!agent) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-20 text-center"
          data-ocid="agent.error_state"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Radar className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Agent not found
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This agent may have been removed from the swarm.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/dashboard">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[agent.status];
  const moneyData = agent.moneyHistory.map((snapshot, index) => ({
    index: String(index),
    value: snapshot.money,
  }));
  const knowledgeData = agent.knowledgeTimeline.map((snapshot, index) => ({
    index: String(index),
    value: snapshot.knowledge,
  }));

  const handleSpotlight = () => {
    setSpotlight(isSpotlighted ? null : agent.id);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Back to dashboard"
          >
            <Link to="/dashboard">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <span className="flex size-11 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
            <span className="font-mono text-sm font-bold">
              #{agent.id.toString()}
            </span>
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {agent.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={cn("gap-1.5", statusStyle.badge)}
                data-ocid="agent.status_badge"
              >
                <span
                  className={cn("size-1.5 rounded-full", statusStyle.dot)}
                />
                {statusLabel(agent.status)}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                Gen {agent.generation.toString()}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant={isSpotlighted ? "secondary" : "default"}
          onClick={handleSpotlight}
          data-ocid="agent.spotlight_button"
        >
          <Radar className="size-4" />
          {isSpotlighted ? "Following evolution" : "Follow evolution"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Money supply"
          value={formatMoney(agent.money)}
          icon={Coins}
          accent="border-state-alive/40 bg-state-alive/10 text-state-alive"
        />
        <StatCard
          label="Knowledge"
          value={formatKnowledge(agent.knowledge)}
          icon={Brain}
          accent="border-state-evolving/40 bg-state-evolving/10 text-state-evolving"
        />
        <StatCard
          label="Generation"
          value={`Gen ${agent.generation.toString()}`}
          icon={Layers}
          accent="border-accent/40 bg-accent/10 text-accent"
        />
        <StatCard
          label="Status"
          value={statusLabel(agent.status)}
          icon={CircleDot}
          accent={cn("border-current/40 bg-current/10", statusStyle.text)}
        />
      </div>

      {/* Strategy + traits */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="gap-3 py-5 lg:col-span-1">
          <CardHeader className="px-5 py-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="size-4 text-state-dormant" />
              Current strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="font-display text-lg font-semibold leading-snug">
              {agent.strategy.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {agent.strategy.description}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3 py-5 lg:col-span-2">
          <CardHeader className="px-5 py-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Brain className="size-4 text-state-evolving" />
              Evolved knowledge traits
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            {agent.traits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No knowledge traits evolved yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {agent.traits.map((trait) => (
                  <Badge
                    key={trait.name}
                    variant="outline"
                    className="border-state-evolving/40 bg-state-evolving/10 text-state-evolving"
                    data-ocid={`agent.trait.${trait.name}`}
                  >
                    {trait.name}
                    <span className="ml-1 font-mono text-[10px] opacity-70">
                      Lv {trait.level.toString()}
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <HistoryChart
          title="Money supply history"
          description="Money supply across recorded simulation ticks."
          data={moneyData}
          color="oklch(var(--state-alive))"
          formatter={formatMoney}
          dataKey="money"
        />
        <HistoryChart
          title="Knowledge growth timeline"
          description="Knowledge level across recorded simulation ticks."
          data={knowledgeData}
          color="oklch(var(--state-evolving))"
          formatter={formatKnowledge}
          dataKey="knowledge"
        />
      </div>

      {/* Governing rules */}
      <div className="mt-6">
        <GoverningRulesCard
          rules={rules ?? []}
          domain={agent.strategy.name}
          loading={rulesLoading}
        />
      </div>

      {/* Lineage */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LineageCard
          title="Ancestors"
          ids={agent.lineage.ancestors}
          emptyLabel="This agent is a root — it has no ancestors."
          accent="text-state-dormant"
        />
        <LineageCard
          title="Descendants"
          ids={agent.lineage.descendants}
          emptyLabel="No descendants evolved yet."
          accent="text-state-evolving"
        />
      </div>

      {/* Learning lineage + networks */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LearningLineageCard
          records={learning ?? []}
          loading={learningLoading}
        />
        <NetworksCard
          networks={networks}
          agentId={agent.id}
          loading={networksLoading}
        />
      </div>

      {/* Trade history */}
      <div className="mt-6">
        <TradeHistoryCard trades={trades ?? []} loading={tradesLoading} />
      </div>
    </div>
  );
}
