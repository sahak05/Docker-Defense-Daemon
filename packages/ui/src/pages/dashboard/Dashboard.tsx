import React, { useMemo, useCallback } from "react";
import styles from "./styles/dashboard.module.css";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useThemeConfig } from "../../hooks/useThemeConfig";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import {
  DashboardProvider,
  useDashboardContext,
} from "../../context/DashboardContext";
import {
  DashboardHeader,
  SummaryCards,
  AlertsSection,
  ContainersSection,
  ActivityTimeline,
  DashboardEmpty,
} from "./sub-components";

interface DashboardProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

/**
 * DashboardContent
 *
 * Inner component that consumes DashboardContext
 * Renders all sections using composed sub-components
 */
const DashboardContent: React.FC = () => {
  const { loading, dashboardData } = useDashboardContext();

  // Only render content when data is loaded
  if (loading || !dashboardData) {
    return <DashboardEmpty />;
  }

  return (
    <div
      className={styles.dashboard}
      style={
        {
          // Apply dark/light mode class from context would be better,
          // but we use inline approach for now
        }
      }
    >
      <DashboardHeader />
      <SummaryCards />

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        <AlertsSection />
        <ContainersSection />
      </div>

      <ActivityTimeline />
    </div>
  );
};

/**
 * Dashboard
 *
 * Main component that:
 * - Fetches data via useDashboardData hook
 * - Manages theme configuration
 * - Uses React Router navigation
 * - Sets up DashboardProvider for context
 * - Renders composed sub-components
 *
 * Reduced from 661 lines to ~70 lines!
 */
const Dashboard: React.FC<DashboardProps> = ({
  isDarkMode: propIsDarkMode,
  onToggleDarkMode,
}) => {
  // Data fetching
  const { dashboardData, loading, error } = useDashboardData();

  // Theme configuration
  const { isDarkMode, toggleTheme } = useThemeConfig(propIsDarkMode);

  // React Router navigation
  const { toAlerts, toContainers } = useAppNavigation();

  const actualToggle = onToggleDarkMode ?? toggleTheme;

  // Navigation callback that maps page names to routes
  const handleNavigate = useCallback(
    (page: string, _itemId?: string) => {
      switch (page) {
        case "alerts":
          toAlerts();
          break;
        case "containers":
          toContainers();
          break;
        default:
          break;
      }
    },
    [toAlerts, toContainers]
  );

  // Memoize computed metrics
  const memoryPercentage = useMemo(() => {
    if (!dashboardData?.summary?.systemMetrics?.memory) return "0";
    return dashboardData.summary.systemMetrics.memory.percentage.toFixed(1);
  }, [dashboardData?.summary?.systemMetrics?.memory]);

  return (
    <DashboardProvider
      dashboardData={dashboardData}
      loading={loading}
      error={error}
      isDarkMode={isDarkMode}
      onToggleDarkMode={actualToggle}
      onNavigate={handleNavigate}
      memoryPercentage={parseFloat(memoryPercentage)}
    >
      <div
        className={`${styles.dashboard} ${
          isDarkMode ? styles.dark : styles.light
        }`}
      >
        <DashboardContent />
      </div>
    </DashboardProvider>
  );
};

export default Dashboard;
