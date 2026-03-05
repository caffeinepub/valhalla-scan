import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Leaderboard } from "@/pages/Leaderboard";
import { LiveFeed } from "@/pages/LiveFeed";
import { TokenDetail } from "@/pages/TokenDetail";
import { TokenScreener } from "@/pages/TokenScreener";
import { UserLookup } from "@/pages/UserLookup";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

// Individual routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const screenerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/screener",
  component: TokenScreener,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
});

const tokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/token/$id",
  component: TokenDetail,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: LiveFeed,
});

const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/user",
  component: UserLookup,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: Leaderboard,
});

// Router
const routeTree = rootRoute.addChildren([
  indexRoute,
  screenerRoute,
  tokenRoute,
  feedRoute,
  userRoute,
  leaderboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
