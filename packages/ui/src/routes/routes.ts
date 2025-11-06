import React, { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { routeConfig } from "./routes.config";
import RouteLoader from "./RouteLoader";

/**
 * Wrapper function to provide Suspense boundary around lazy-loaded route components
 * This ensures each route shows a loading UI while the component is being fetched
 */
const withSuspense = (
  component: React.ComponentType<any>
): React.ReactElement => {
  return React.createElement(
    Suspense,
    { fallback: React.createElement(RouteLoader) },
    React.createElement(component)
  );
};

/**
 * React Router v6 Route Objects with Lazy Loading
 *
 * - Uses React.lazy() for code-splitting each route component
 * - Suspense catches lazy component loading and shows RouteLoader
 * - Each route is only loaded when accessed, improving initial bundle size
 * - Dramatically improves first page load performance
 */
export const routes: RouteObject[] = routeConfig.map((route) => ({
  path: route.path,
  element: withSuspense(route.component),
}));

/**
 * Fallback route (404)
 * Redirects to dashboard for unmatched routes
 * Also wrapped in Suspense for consistency
 */
export const fallbackRoute: RouteObject = {
  path: "*",
  element: withSuspense(routeConfig[0].component),
};
