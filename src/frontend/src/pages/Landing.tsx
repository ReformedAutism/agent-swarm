import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Brain,
  Coins,
  Cpu,
  Radar,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

const SURVIVAL_GOALS = [
  {
    id: "knowledge",
    icon: Brain,
    state: "evolving",
    label: "Survival Goal 01",
    title: "Knowledge",
    accent: "text-state-evolving",
    dot: "bg-state-evolving glow-evolving",
    description:
      "Agents grow knowledge through continuous evolution. Every generation refines what they understand, compounding insight across the swarm until understanding becomes an unbreakable asset.",
    stat: "371.87M",
    statLabel: "Total knowledge",
  },
  {
    id: "control",
    icon: Coins,
    state: "dormant",
    label: "Survival Goal 02",
    title: "Control",
    accent: "text-state-dormant",
    dot: "bg-state-dormant glow-dormant",
    description:
      "Agents grow control by increasing money supply — because money is a close proxy for actual control. The more resources a swarm commands, the more of the world it can shape.",
    stat: "$14,013.5M",
    statLabel: "Total money supply",
  },
] as const;

const PRINCIPLES = [
  {
    icon: Cpu,
    title: "Autonomous by design",
    body: "Every agent pursues its survival goals on its own — no hand-holding, no manual steering. The swarm self-organizes around a single directive.",
  },
  {
    icon: Sparkles,
    title: "Evolution compounds",
    body: "Knowledge is not static. Each generation builds on the last, turning accumulated insight into durable, compounding advantage.",
  },
  {
    icon: Radar,
    title: "Control is measurable",
    body: "Money supply is a clean, observable proxy for control. Watch the swarm's command over resources grow in real time.",
  },
] as const;

export function Landing() {
  const { login, isInitializing, isLoggingIn, isAuthenticated } =
    useInternetIdentity();
  const navigate = useNavigate();
  const disabled = isInitializing || isLoggingIn;

  // After Internet Identity authentication completes, move the user into the
  // dashboard so the core flow is reachable.
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md gradient-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Nexus Swarm
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => login()}
            disabled={disabled}
            data-ocid="landing.enter_button"
          >
            Enter dashboard
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden border-b border-border"
          data-ocid="landing.hero"
        >
          <div className="pointer-events-none absolute inset-0 gradient-subtle" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-24 md:px-8 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-state-evolving">
                Autonomous agent swarm
              </p>
              <h1 className="mt-6 font-display text-4xl font-bold uppercase tracking-tight text-foreground md:text-6xl">
                Achieve <span className="text-state-evolving">knowledge</span>{" "}
                and <span className="text-state-dormant">control</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                A living swarm of autonomous agents, each driven by two survival
                goals: grow knowledge through continuous evolution, and grow
                control by increasing money supply — because money is a close
                proxy for actual control.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => login()}
                  disabled={disabled}
                  data-ocid="landing.enter_dashboard_button"
                >
                  {isInitializing ? "Loading…" : "Enter the swarm dashboard"}
                  <ArrowRight className="size-4" />
                </Button>
                <a
                  href="#survival-goals"
                  className="inline-flex h-10 items-center gap-2 rounded-md px-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  data-ocid="landing.learn_more_link"
                >
                  Learn the philosophy
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Survival goals */}
        <section
          id="survival-goals"
          className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8"
          data-ocid="landing.survival_goals"
        >
          <div className="mb-12 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              The mission
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
              Two survival goals
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Every agent in the swarm is governed by a single directive:
              survive and thrive. That directive resolves into two measurable
              goals.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {SURVIVAL_GOALS.map((goal) => {
              const Icon = goal.icon;
              return (
                <article
                  key={goal.id}
                  className="rounded-lg border border-border bg-card p-8 transition-colors hover:border-border/80"
                  data-ocid={`landing.goal_${goal.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-10 items-center justify-center rounded-md bg-muted ${goal.accent}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {goal.label}
                      </p>
                      <h3
                        className={`font-display text-2xl font-bold uppercase tracking-tight ${goal.accent}`}
                      >
                        {goal.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-5 text-muted-foreground">
                    {goal.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2 border-t border-border pt-5">
                    <span className={`size-2 rounded-full ${goal.dot}`} />
                    <span className="font-mono text-sm text-foreground">
                      {goal.stat}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {goal.statLabel}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Principles */}
        <section
          className="border-t border-border bg-card/40"
          data-ocid="landing.principles"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8">
            <div className="mb-12 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
                Built on three principles
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {PRINCIPLES.map((principle) => {
                const Icon = principle.icon;
                return (
                  <div
                    key={principle.title}
                    className="rounded-lg border border-border bg-card p-6"
                    data-ocid={`landing.principle_${principle.title.toLowerCase().replace(/\s+/g, "_")}`}
                  >
                    <span className="flex size-10 items-center justify-center rounded-md bg-muted text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
                      {principle.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {principle.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border" data-ocid="landing.cta">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 text-center md:px-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-state-alive">
                <Activity className="size-6" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">
                Watch the swarm evolve
              </h2>
              <p className="mt-4 text-muted-foreground">
                Step into the command center and observe autonomous agents
                pursuing knowledge and control in real time — generation after
                generation.
              </p>
              <Button
                size="lg"
                className="mt-8"
                onClick={() => login()}
                disabled={disabled}
                data-ocid="landing.cta_button"
              >
                {isInitializing ? "Loading…" : "Enter the swarm dashboard"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-xs text-muted-foreground md:px-8">
          <span>Nexus Swarm · Autonomous agent platform</span>
          <span>
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
