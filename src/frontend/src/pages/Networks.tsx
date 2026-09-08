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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAgents,
  useCreateNetwork,
  useJoinNetwork,
  useLeaveNetwork,
  useNetworks,
} from "@/hooks/useQueries";
import { formatPerformance } from "@/lib/format";
import type { Network } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Network as NetworkIcon,
  Plus,
  Sparkles,
  UserMinus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function NetworkSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1].map((n) => (
        <Card
          key={`network-skeleton-${n}`}
          className="border-border bg-card shadow-subtle"
        >
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NetworkCard({
  network,
  index,
}: {
  network: Network;
  index: number;
}) {
  const { data: agents } = useAgents();
  const joinNetwork = useJoinNetwork();
  const leaveNetwork = useLeaveNetwork();

  const memberIds = new Set(network.memberAgentIds.map((id) => id.toString()));
  const members = (agents ?? []).filter((a) => memberIds.has(a.id.toString()));
  const availableAgents = (agents ?? []).filter(
    (a) => !memberIds.has(a.id.toString()),
  );

  const performance = network.collectivePerformance;

  const handleJoin = (agentId: string) => {
    joinNetwork.mutate(
      { networkId: network.id, agentId: BigInt(agentId) },
      {
        onSuccess: () => toast.success("Agent joined the network"),
        onError: () => toast.error("Could not add agent to the network"),
      },
    );
  };

  const handleLeave = (agentId: string) => {
    leaveNetwork.mutate(
      { networkId: network.id, agentId: BigInt(agentId) },
      {
        onSuccess: () => toast.success("Agent left the network"),
        onError: () => toast.error("Could not remove agent from the network"),
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className="flex h-full flex-col border-border bg-card shadow-subtle">
        <CardHeader className="gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-network/40 bg-network/10 text-network">
                <NetworkIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate font-display text-base font-semibold text-foreground">
                  {network.name}
                </CardTitle>
                <CardDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
                  <Users className="size-3.5" />
                  {network.memberAgentIds.length} member
                  {network.memberAgentIds.length === 1 ? "" : "s"}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 border-network/40 bg-network/10 text-network"
              data-ocid={`network.id_badge.${index}`}
            >
              #{network.id.toString()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-5 p-5">
          {/* Collective performance */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Collective performance
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums text-network">
                {formatPerformance(performance)}
              </p>
            </div>
            <Progress
              value={Math.max(0, Math.min(100, performance * 100))}
              className="mt-2 h-2"
              data-ocid={`network.performance.${index}`}
            />
          </div>

          {/* Shared strategy pool */}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <BookOpen className="size-3.5" />
              Shared strategy pool
            </p>
            {network.sharedStrategyPool.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No strategies shared yet.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {network.sharedStrategyPool.map((strategy) => (
                  <Badge
                    key={strategy.name}
                    variant="outline"
                    className="border-network/40 bg-network/10 text-network"
                    data-ocid={`network.strategy.${index}.${strategy.name}`}
                  >
                    {strategy.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Users className="size-3.5" />
              Member agents
            </p>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No agents in this network yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {members.map((agent, memberIndex) => (
                  <li
                    key={agent.id.toString()}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5"
                    data-ocid={`network.member.${index}.${memberIndex}`}
                  >
                    <Link
                      to="/agents/$agentId"
                      params={{ agentId: agent.id.toString() }}
                      className="flex min-w-0 items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                    >
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        #{agent.id.toString()}
                      </span>
                      <span className="truncate font-medium">{agent.name}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleLeave(agent.id.toString())}
                      disabled={leaveNetwork.isPending}
                      aria-label={`Remove ${agent.name} from ${network.name}`}
                      data-ocid={`network.leave_button.${index}.${memberIndex}`}
                    >
                      <UserMinus className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add member */}
          <div className="border-t border-border pt-4">
            <Select
              value=""
              onValueChange={handleJoin}
              disabled={availableAgents.length === 0 || joinNetwork.isPending}
            >
              <SelectTrigger
                className="w-full"
                data-ocid={`network.join_select.${index}`}
                aria-label={`Add an agent to ${network.name}`}
              >
                <SelectValue
                  placeholder={
                    availableAgents.length === 0
                      ? "No agents available to join"
                      : "Add an agent to this network"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.map((agent) => (
                  <SelectItem
                    key={agent.id.toString()}
                    value={agent.id.toString()}
                  >
                    #{agent.id.toString()} · {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Networks() {
  const { data: networks, isLoading } = useNetworks();
  const createNetwork = useCreateNetwork();
  const [name, setName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createNetwork.mutate(trimmed, {
      onSuccess: () => {
        setName("");
        setDialogOpen(false);
        toast.success("Network created");
      },
      onError: () => toast.error("Could not create the network"),
    });
  };

  const hasNetworks = (networks?.length ?? 0) > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <NetworkIcon className="size-3.5 text-network" />
            Nexus Swarm Control
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
            Agent Networks
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Networks let agents share strategies and coordinate trading. Track
            each network's membership, shared strategy pool, and collective
            performance.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="network.create_button">
              <Plus className="size-4" /> Create network
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="network.create_dialog">
            <DialogHeader>
              <DialogTitle>Create a network</DialogTitle>
              <DialogDescription>
                Give the network a name. Agents can join it to share strategies
                and coordinate trading.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="network-name">Network name</Label>
                <Input
                  id="network-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alpha Syndicate"
                  autoFocus
                  data-ocid="network.name_input"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="network.create_cancel"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={!name.trim() || createNetwork.isPending}
                  data-ocid="network.create_submit"
                >
                  {createNetwork.isPending ? "Creating…" : "Create network"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Network grid / states */}
      <div className="mt-6">
        {isLoading ? (
          <NetworkSkeleton />
        ) : !hasNetworks ? (
          <Card className="border-border bg-card shadow-subtle">
            <CardContent
              className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
              data-ocid="network.empty_state"
            >
              <span className="flex size-14 items-center justify-center rounded-full border border-network/40 bg-network/10 text-network">
                <NetworkIcon className="size-6" />
              </span>
              <div className="max-w-md">
                <h2 className="font-display text-xl font-bold text-foreground">
                  No networks yet
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first network to let agents share strategies and
                  coordinate trading together.
                </p>
              </div>
              <Button
                onClick={() => setDialogOpen(true)}
                data-ocid="network.empty_create_button"
              >
                <Sparkles className="size-4" /> Create a network
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {networks?.map((network, index) => (
              <NetworkCard
                key={network.id.toString()}
                network={network}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
