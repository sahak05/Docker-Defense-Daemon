/**
 * Routes Barrel Export
 *
 * Provides clean imports for routing functionality
 * Import from this file rather than individual route files
 */

export { ROUTE_PATHS } from "./constants";
export type { RouteMetaData, RouteConfig } from "./types";
export {
  routeConfig,
  getRouteById,
  getRouteByPath,
  getNavigationRoutes,
} from "./routes.config";
export { routes, fallbackRoute } from "./routes";
