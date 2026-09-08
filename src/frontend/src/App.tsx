import { Layout } from "@/components/Layout";
import { useSimulationDriver } from "@/hooks/useQueries";
import { AgentDetail } from "@/pages/AgentDetail";
import { Dashboard } from "@/pages/Dashboard";
import { Landing } from "@/pages/Landing";
import { Networks } from "@/pages/Networks";
import { AGENT_SORT_KEYS, AGENT_STATUSES } from "@/types";
import type { AgentSortKey, AgentStatus } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

function RootLayout() {
  return <Outlet />;
}

function ProtectedLayout() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();

  // Drive the simulation forward on a periodic tick while authenticated.
  useSimulationDriver();

  if (isInitializing) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        data-ocid="app.loading_state"
      >
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <Layout />;
}

export interface DashboardSearch {
  sort: AgentSortKey;
  dir: "asc" | "desc";
  status: AgentStatus | "all";
}

function validateDashboardSearch(
  search: Record<string, unknown>,
): DashboardSearch {
  const sort = AGENT_SORT_KEYS.includes(search.sort as AgentSortKey)
    ? (search.sort as AgentSortKey)
    : "money";
  const dir = search.dir === "asc" ? "asc" : "desc";
  const status = AGENT_STATUSES.includes(search.status as AgentStatus)
    ? (search.status as AgentStatus)
    : "all";
  return { sort, dir, status };
}

const rootRoute = createRootRoute({ component: RootLayout });

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
});

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/dashboard",
  component: Dashboard,
  validateSearch: validateDashboardSearch,
});

const agentDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/agents/$agentId",
  component: AgentDetail,
});

const networksRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/networks",
  component: Networks,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  protectedLayout.addChildren([
    dashboardRoute,
    agentDetailRoute,
    networksRoute,
  ]),
]);

const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
