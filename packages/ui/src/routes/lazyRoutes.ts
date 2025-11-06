import React from "react";

/**
 * Lazy-loaded Route Components
 *
 * Uses React.lazy() for code-splitting
 * Each component is loaded only when its route is accessed
 * Combined with Suspense in routes.ts for loading UI
 */

// Dashboard
export const Dashboard = React.lazy(() =>
  import("../pages/dashboard/Dashboard").then((module) => ({
    default: module.default,
  }))
);

// Containers Page
export const ContainersPage = React.lazy(() =>
  import("../pages/containers/ContainersPage").then((module) => ({
    default: module.ContainersPage,
  }))
);

// Alerts Center
export const AlertsCenter = React.lazy(() =>
  import("../pages/alerts/AlertsCenter").then((module) => ({
    default: module.AlertsCenter,
  }))
);

// System Status
export const SystemStatus = React.lazy(() =>
  import("../pages/system-status/SystemStatus").then((module) => ({
    default: module.SystemStatus,
  }))
);

// Event Logs
export const EventLogs = React.lazy(() =>
  import("../pages/events/EventLogs").then((module) => ({
    default: module.EventLogs,
  }))
);

// Settings Page
export const SettingsPage = React.lazy(() =>
  import("../pages/settings/Settings").then((module) => ({
    default: module.Settings,
  }))
);
