import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "../routes/constants";

/**
 * useAppNavigation Hook
 *
 * Provides convenient typed navigation for the application
 * Wraps React Router's useNavigate with app-specific paths
 *
 * @example
 * const { toDashboard, toAlerts, toContainers } = useAppNavigation();
 *
 * <button onClick={toDashboard}>Go Home</button>
 */
export const useAppNavigation = () => {
  const navigate = useNavigate();

  return {
    // Dashboard
    toDashboard: () => navigate(ROUTE_PATHS.DASHBOARD),

    // Containers
    toContainers: () => navigate(ROUTE_PATHS.CONTAINERS),

    // Alerts
    toAlerts: () => navigate(ROUTE_PATHS.ALERTS),

    // Events
    toEventLogs: () => navigate(ROUTE_PATHS.EVENT_LOGS),

    // System Status
    toSystemStatus: () => navigate(ROUTE_PATHS.SYSTEM_STATUS),

    // Settings
    toSettings: () => navigate(ROUTE_PATHS.SETTINGS),

    // Generic navigation with optional state
    navigateTo: (path: string, state?: unknown) => navigate(path, { state }),

    // Go back to previous page
    goBack: () => navigate(-1),

    // Go forward to next page
    goForward: () => navigate(1),
  };
};
