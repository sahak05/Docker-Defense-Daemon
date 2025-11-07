import {
  LayoutDashboard,
  // Settings,
  AlertCircle,
  Container,
  Activity,
  ScrollText,
  Shield,
} from "lucide-react";
import * as LazyComponents from "./lazyRoutes";
import type { RouteConfig } from "./types";

/**
 * Application Routes Configuration
 *
 * Defines all routes with their paths, labels, icons, and components
 * Uses lazy-loaded components for code-splitting
 * Each component is loaded only when its route is accessed
 */
export const routeConfig: RouteConfig[] = [
  {
    id: "dashboard",
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    component: LazyComponents.Dashboard,
    description: "Main dashboard overview",
  },
  {
    id: "containers",
    path: "/containers",
    label: "Containers",
    icon: Container,
    component: LazyComponents.ContainersPage,
    description: "View and manage containers",
  },
  {
    id: "alerts",
    path: "/alerts",
    label: "Alerts",
    icon: AlertCircle,
    component: LazyComponents.AlertsCenter,
    description: "Security alerts and violations",
  },
  {
    id: "event-logs",
    path: "/event-logs",
    label: "Event Logs",
    icon: ScrollText,
    component: LazyComponents.EventLogs,
    description: "System event logs",
  },
  {
    id: "system-status",
    path: "/system-status",
    label: "System Status",
    icon: Activity,
    component: LazyComponents.SystemStatus,
    description: "System health and metrics",
  },
  // {
  //   id: "settings",
  //   path: "/settings",
  //   label: "Settings",
  //   icon: Settings,
  //   component: LazyComponents.SettingsPage,
  //   description: "Application settings",
  // },
  {
    id: "approvals",
    path: "/approvals",
    label: "Image Approvals",
    icon: Shield,
    component: LazyComponents.ImageApprovalsPage,
    description: "Manage image approvals",
  },
];

/**
 * Get route config by ID
 */
export const getRouteById = (id: string): RouteConfig | undefined => {
  return routeConfig.find((route) => route.id === id);
};

/**
 * Get route config by path
 */
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return routeConfig.find((route) => route.path === path);
};

/**
 * Get all route navigation items (for sidebar/navbar)
 * Excludes root path to avoid duplicate dashboard entry
 */
export const getNavigationRoutes = (): RouteConfig[] => {
  return routeConfig;
};
