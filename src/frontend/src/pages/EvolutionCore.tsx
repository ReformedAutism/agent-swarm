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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
  useAdvanceEpoch,
  useCoreMetrics,
  useOrchestrationLog,
  useResetEvolutionCore,
  useRules,
} from "@/hooks/useQueries";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ContinuationScore,
  OrchestrationKind,
  OrchestrationLogEntry,
  RuleRecord,
  RuleStatus,
} from "@/types";
import {
  Activity,
  ArrowRight,
  Braces,
  Coins,
  Cpu,
  FlaskConical,
  Gauge,
  GitBranch,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Continuation gauge                                                  */
/* ------------------------------------------------------------------ */

const GAUGE_START = 150;
const GAUGE_SWEEP = 240;

function polarPoint(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-continuation-healthy";
  if (score >= 45) return "text-continuation-conserving";
  return "text-continuation-critical";
}

function ContinuationGauge({
  score,
  loading,
}: {
  score: ContinuationScore | undefined;
  loading: boolean;
}) {
  const value = score?.compositeScore ?? 0;
  // compositeScore is a [0,1] fraction; scale to a 0-100 percentage gauge.
  const percent = Math.min(100, Math.max(0, value * 100));
  const needleAngle = GAUGE_START + (percent / 100) * GAUGE_SWEEP;
  const cx = 100;
  const cy = 100;
  const r = 78;
  const needle = polarPoint(cx, cy, r - 14, needleAngle);

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-continuation-healthy/40 bg-continuation-healthy/10 text-continuation-healthy">
            <Gauge className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Continuation Score
            </h2>
            <p className="text-xs text-muted-foreground">
              Composite survival metric across the swarm
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-44 w-full" />
        ) : (
          <div className="flex flex-col items-center">
            <div
              className="relative w-full max-w-[260px] animate-epoch-pulse rounded-full"
              data-ocid="evolution.gauge"
            >
              <svg viewBox="0 0 200 150" className="w-full">
                <title>Continuation score gauge</title>
                <defs>
                  <linearGradient
                    id="gauge-gradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="oklch(var(--continuation-critical))"
                    />
                    <stop
                      offset="50%"
                      stopColor="oklch(var(--continuation-conserving))"
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(var(--continuation-healthy))"
                    />
                  </linearGradient>
                </defs>
                <path
                  d={arcPath(cx, cy, r, GAUGE_START, GAUGE_START + GAUGE_SWEEP)}
                  fill="none"
                  stroke="oklch(var(--border))"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d={arcPath(
                    cx,
                    cy,
                    r,
                    GAUGE_START,
                    GAUGE_START + (percent / 100) * GAUGE_SWEEP,
                  )}
                  fill="none"
                  stroke="url(#gauge-gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <line
                  x1={cx}
                  y1={cy}
                  x2={needle.x}
                  y2={needle.y}
                  stroke="oklch(var(--foreground))"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r="6" fill="oklch(var(--foreground))" />
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                <span
                  className={cn(
                    "font-mono text-4xl font-bold tabular-nums",
                    scoreColor(percent),
                  )}
                >
                  {percent.toFixed(1)}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  composite
                </span>
              </div>
            </div>

            <div className="mt-4 grid w-full grid-cols-3 gap-2">
              {[
                { label: "Survival", value: score?.survival ?? 0 },
                { label: "Reserves", value: score?.reserves ?? 0 },
                { label: "Uptime", value: score?.uptime ?? 0 },
              ].map(({ label, value: v }) => (
                <div
                  key={label}
                  className="rounded-md border border-border bg-background px-2 py-2 text-center"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-sm font-semibold tabular-nums",
                      scoreColor(v * 100),
                    )}
                  >
                    {(v * 100).toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Budget burn-down                                                    */
/* ------------------------------------------------------------------ */

function BudgetBurnDown({
  perEpoch,
  spent,
  remaining,
  loading,
}: {
  perEpoch: bigint;
  spent: bigint;
  remaining: bigint;
  loading: boolean;
}) {
  const total = Number(perEpoch);
  const spentNum = Number(spent);
  const remainingNum = Number(remaining);
  const pct = total > 0 ? (spentNum / total) * 100 : 0;
  const threshold = 80;

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-budget/40 bg-budget/10 text-budget">
            <Coins className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Resource Budget
            </h2>
            <p className="text-xs text-muted-foreground">
              Per-epoch burn-down against the resource cap
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Spent this epoch
                </p>
                <p className="font-mono text-3xl font-bold tabular-nums text-budget">
                  {formatInteger(spentNum)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Remaining
                </p>
                <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                  {formatInteger(remainingNum)}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct >= threshold ? "bg-continuation-critical" : "bg-budget",
                  )}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <div
                className="absolute -top-1 bottom-0 w-0.5 bg-warning"
                style={{ left: `${threshold}%` }}
                title="Threshold"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-budget" />
                Spent · {pct.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-warning" />
                Threshold · {threshold}%
              </span>
            </div>

            <div className="rounded-md border border-border bg-background p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Epoch cap
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatInteger(total)} resource units
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Core parameters                                                     */
/* ------------------------------------------------------------------ */

function CoreParameters({
  metrics,
  loading,
}: {
  metrics: ReturnType<typeof useCoreMetrics>["data"];
  loading: boolean;
}) {
  const params = [
    {
      label: "Continuation metric",
      value: metrics
        ? `${(metrics.currentScore.compositeScore * 100).toFixed(1)}%`
        : "—",
      icon: Gauge,
      accent: "text-continuation-healthy",
    },
    {
      label: "Budget cap",
      value: metrics
        ? formatInteger(Number(metrics.budgetState.perEpoch))
        : "—",
      icon: Coins,
      accent: "text-budget",
    },
    {
      label: "Epoch",
      value: metrics ? metrics.epoch.toString() : "—",
      icon: Timer,
      accent: "text-orchestrate",
    },
    {
      label: "Core status",
      value: metrics ? metrics.coreStatus : "—",
      icon: Cpu,
      accent: "text-state-evolving",
    },
  ];

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-orchestrate/40 bg-orchestrate/10 text-orchestrate">
            <Cpu className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Core Parameters
            </h2>
            <p className="text-xs text-muted-foreground">
              Live configuration of the evolution engine
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={`param-skel-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {params.map(({ label, value, icon: Icon, accent }) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon className={cn("size-4 shrink-0", accent)} />
                  <span className="truncate text-sm text-muted-foreground">
                    {label}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Rule registry                                                       */
/* ------------------------------------------------------------------ */

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

function RuleRegistry({
  rules,
  loading,
}: {
  rules: RuleRecord[];
  loading: boolean;
}) {
  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-rule-active/40 bg-rule-active/10 text-rule-active">
            <Braces className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Rule Registry
            </h2>
            <p className="text-xs text-muted-foreground">
              Governing rules and their measured contribution to continuation
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={`rule-skel-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="evolution.rules_empty_state"
          >
            <Braces className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No rules registered yet. Advance an epoch to seed the registry.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table data-ocid="evolution.rules_table">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead className="text-right">Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                  <TableHead className="text-right">Epoch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule, i) => {
                  const meta = RULE_STATUS_META[rule.status];
                  const positive = rule.contribution >= 0;
                  return (
                    <TableRow
                      key={rule.id.toString()}
                      data-ocid={`evolution.rule.row.${i}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{rule.id.toString()}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {rule.domain}
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {rule.body}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        v{rule.version.toString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5 border-transparent",
                            meta.badge,
                          )}
                          data-ocid={`evolution.rule.status.${i}`}
                        >
                          <span
                            className={cn("size-1.5 rounded-full", meta.dot)}
                          />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums",
                            positive ? "text-trade-buy" : "text-trade-sell",
                          )}
                        >
                          {positive ? (
                            <TrendingUp className="size-3" />
                          ) : (
                            <TrendingDown className="size-3" />
                          )}
                          {positive ? "+" : ""}
                          {(rule.contribution * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {rule.createdEpoch.toString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Mutation lineage                                                    */
/* ------------------------------------------------------------------ */

function MutationLineage({
  rules,
  loading,
}: {
  rules: RuleRecord[];
  loading: boolean;
}) {
  const byId = new Map(rules.map((r) => [r.id.toString(), r]));
  const depthOf = (rule: RuleRecord): number => {
    let depth = 0;
    let current: RuleRecord | undefined = rule;
    const seen = new Set<string>();
    while (current?.parent !== undefined && !seen.has(current.id.toString())) {
      seen.add(current.id.toString());
      current = byId.get(current.parent.toString());
      depth += 1;
    }
    return depth;
  };

  const nodes = rules.map((rule) => ({ rule, depth: depthOf(rule) }));
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const columns = Array.from({ length: maxDepth + 1 }, (_, depth) => ({
    depth,
    nodes: [] as typeof nodes,
  }));
  for (const node of nodes) columns[node.depth].nodes.push(node);

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-orchestrate-mutate/40 bg-orchestrate-mutate/10 text-orchestrate-mutate">
            <GitBranch className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Mutation Lineage
            </h2>
            <p className="text-xs text-muted-foreground">
              How rules descend from their parents through mutation
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : rules.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="evolution.lineage_empty_state"
          >
            <GitBranch className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No mutation lineage yet. Rules branch as the core evolves.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div className="flex min-w-[640px] items-start gap-6">
              {columns.map((col) => (
                <div
                  key={`lineage-gen-${col.depth}`}
                  className="flex flex-1 flex-col gap-3"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Gen {col.depth}
                  </p>
                  {col.nodes.length === 0 ? (
                    <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      —
                    </div>
                  ) : (
                    col.nodes.map(({ rule }, i) => {
                      const meta = RULE_STATUS_META[rule.status];
                      return (
                        <div
                          key={rule.id.toString()}
                          className="relative rounded-lg border border-orchestrate-mutate/30 bg-orchestrate-mutate/5 p-3 glow-orchestrate-mutate"
                          data-ocid={`evolution.lineage.node.${col.depth}.${i}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-orchestrate-mutate">
                              #{rule.id.toString()}
                            </span>
                            <span
                              className={cn("size-1.5 rounded-full", meta.dot)}
                            />
                          </div>
                          <p className="mt-1 truncate text-xs font-medium text-foreground">
                            {rule.domain}
                          </p>
                          <p className="truncate font-mono text-[10px] text-muted-foreground">
                            v{rule.version.toString()}
                          </p>
                          {rule.parent !== undefined && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <ArrowRight className="size-3 text-orchestrate-mutate" />
                              <span className="font-mono">
                                parent #{rule.parent.toString()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Orchestration log                                                   */
/* ------------------------------------------------------------------ */

const KIND_META: Record<
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

function OrchestrationLog({
  entries,
  loading,
}: {
  entries: OrchestrationLogEntry[];
  loading: boolean;
}) {
  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-orchestrate/40 bg-orchestrate/10 text-orchestrate">
            <Activity className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Orchestration Log
            </h2>
            <p className="text-xs text-muted-foreground">
              Live activity of the evolution engine
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={`log-skel-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="evolution.log_empty_state"
          >
            <Activity className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No orchestration activity recorded yet.
            </p>
          </div>
        ) : (
          <ul className="mt-4 max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
            {entries.map((entry, i) => {
              const meta = KIND_META[entry.kind];
              const Icon = meta.icon;
              return (
                <li
                  key={`${entry.epoch.toString()}-${i}`}
                  data-ocid={`evolution.log.item.${i}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                      meta.text,
                      "bg-current/10",
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
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-mono">
                        E{entry.epoch.toString()}
                      </span>
                      {entry.continuationDelta !== undefined && (
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            entry.continuationDelta >= 0
                              ? "text-trade-buy"
                              : "text-trade-sell",
                          )}
                        >
                          {entry.continuationDelta >= 0 ? "+" : ""}
                          {(entry.continuationDelta * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
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

/* ------------------------------------------------------------------ */
/* Continuation history chart                                          */
/* ------------------------------------------------------------------ */

function ContinuationHistory({
  history,
  loading,
}: {
  history: ContinuationScore[];
  loading: boolean;
}) {
  const data = history.map((h, i) => ({
    index: String(i),
    value: h.compositeScore * 100,
  }));
  const config = {
    value: {
      label: "Continuation",
      color: "oklch(var(--continuation-healthy))",
    },
  };

  return (
    <Card className="border-border bg-card shadow-subtle">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-continuation-healthy/40 bg-continuation-healthy/10 text-continuation-healthy">
            <TrendingUp className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Continuation History
            </h2>
            <p className="text-xs text-muted-foreground">
              Composite score across recorded epochs
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : data.length === 0 ? (
          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
            data-ocid="evolution.history_empty_state"
          >
            <TrendingUp className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No continuation history recorded yet.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <ChartContainer
              config={config}
              className="aspect-[16/5] w-full"
              data-ocid="evolution.history_chart"
            >
              <AreaChart
                data={data}
                margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="fill-continuation"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="oklch(var(--continuation-healthy))"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(var(--continuation-healthy))"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="index"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: number) => `E${v}`}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v: number) => `${v}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Epoch ${label}`}
                      formatter={(value) => `${Number(value).toFixed(1)}`}
                    />
                  }
                />
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="oklch(var(--continuation-healthy))"
                  strokeWidth={2}
                  fill="url(#fill-continuation)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function EvolutionCore() {
  const { data: metrics, isLoading: metricsLoading } = useCoreMetrics();
  const { data: rules, isLoading: rulesLoading } = useRules();
  const { data: log, isLoading: logLoading } = useOrchestrationLog();
  const advanceEpoch = useAdvanceEpoch();
  const resetCore = useResetEvolutionCore();

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

  const handleAdvance = () => {
    advanceEpoch.mutate(undefined, {
      onSuccess: () => {
        toast.success("Epoch advanced");
      },
      onError: () => {
        toast.error("Could not advance the epoch");
      },
    });
  };

  const handleReset = () => {
    resetCore.mutate(undefined, {
      onSuccess: () => {
        toast.success("Evolution core reset to seed rules");
      },
      onError: () => {
        toast.error("Could not reset the evolution core");
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5" />
            Nexus Swarm Control
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            Evolution Core
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            The self-rewriting rule engine that governs the swarm. Monitor
            continuation, budget burn-down, and the orchestration of rule
            mutations across epochs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
            data-ocid="evolution.status_indicator"
          >
            <span className={cn("size-2 rounded-full", statusMeta.dot)} />
            <span className={cn("text-xs font-medium", statusMeta.text)}>
              {statusMeta.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              · E{metrics?.epoch.toString() ?? "—"}
            </span>
          </div>

          <Button
            onClick={handleAdvance}
            disabled={advanceEpoch.isPending}
            data-ocid="evolution.advance_button"
          >
            <Play className="size-4" />
            {advanceEpoch.isPending ? "Advancing…" : "Advance Epoch"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" data-ocid="evolution.reset_button">
                <RotateCcw className="size-4" /> Reset Core
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="evolution.reset_dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset the Evolution Core?</AlertDialogTitle>
                <AlertDialogDescription>
                  This restores the seed rules and clears the orchestration
                  state. Agents, trades, treasury, and networks are left
                  untouched.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="evolution.reset_cancel">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  data-ocid="evolution.reset_confirm"
                >
                  Reset Core
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Top row: gauge, budget, parameters */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ContinuationGauge
          score={metrics?.currentScore}
          loading={metricsLoading}
        />
        <BudgetBurnDown
          perEpoch={metrics?.budgetState.perEpoch ?? 0n}
          spent={metrics?.budgetState.spent ?? 0n}
          remaining={metrics?.budgetState.remaining ?? 0n}
          loading={metricsLoading}
        />
        <CoreParameters metrics={metrics} loading={metricsLoading} />
      </div>

      {/* Continuation history */}
      <div className="mt-6">
        <ContinuationHistory
          history={metrics?.history ?? []}
          loading={metricsLoading}
        />
      </div>

      {/* Rule registry + orchestration log */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RuleRegistry rules={rules ?? []} loading={rulesLoading} />
        </div>
        <OrchestrationLog entries={log ?? []} loading={logLoading} />
      </div>

      {/* Mutation lineage */}
      <div className="mt-6">
        <MutationLineage rules={rules ?? []} loading={rulesLoading} />
      </div>
    </div>
  );
}
