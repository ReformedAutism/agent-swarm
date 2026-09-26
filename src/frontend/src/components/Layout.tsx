import { Button } from "@/components/ui/button";
import { useSimulationState } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Activity, GitBranch, LogOut, Network, Radar } from "lucide-react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: Radar },
  { to: "/networks", label: "Networks", icon: Network },
  { to: "/evolution", label: "Evolution", icon: GitBranch },
] as const;

export function Layout() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { running, tick } = useSimulationState();

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card shadow-subtle">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Link
            to="/dashboard"
            className="flex shrink-0 items-center gap-2"
            data-ocid="nav.logo"
          >
            <span className="flex size-8 items-center justify-center rounded-md gradient-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Nexus Swarm
            </span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  data-ocid={`nav.${label.toLowerCase()}`}
                  className={cn(
                    "relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {active && (
                    <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
              data-ocid="nav.simulation_indicator"
              title={
                running
                  ? `Simulation running · tick ${tick.toString()}`
                  : "Simulation paused"
              }
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  running
                    ? "bg-state-alive glow-alive animate-tick-pulse"
                    : "bg-state-dormant glow-dormant",
                )}
              />
              <span className="font-mono text-xs text-muted-foreground">
                {running ? "LIVE" : "PAUSED"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-ocid="nav.logout"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 text-xs text-muted-foreground md:px-8">
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
