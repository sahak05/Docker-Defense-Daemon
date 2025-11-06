import React, { createContext, useContext } from "react";
import type { DashboardData } from "../types/dashboard";

/**
 * DashboardContext
 *
 * Provides centralized state for:
 * - Dashboard data (summary, alerts, containers, activity)
 * - Loading/error states
 * - Theme configuration
 * - Navigation callbacks
 *
 * Avoids prop-drilling across 8+ sub-components
 */

interface DashboardContextType {
  // Data
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;

  // Theme
  isDarkMode: boolean;
  onToggleDarkMode: () => void;

  // Navigation
  onNavigate: (page: string, itemId?: string) => void;

  // Derived data
  memoryPercentage: number;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

interface DashboardProviderProps {
  children: React.ReactNode;
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (page: string, itemId?: string) => void;
  memoryPercentage: number;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  dashboardData,
  loading,
  error,
  isDarkMode,
  onToggleDarkMode,
  onNavigate,
  memoryPercentage,
}) => {
  const value: DashboardContextType = {
    dashboardData,
    loading,
    error,
    isDarkMode,
    onToggleDarkMode,
    onNavigate,
    memoryPercentage,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * Hook to consume DashboardContext
 *
 * @throws Error if used outside DashboardProvider
 */
export const useDashboardContext = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardContext must be used within DashboardProvider"
    );
  }
  return context;
};
