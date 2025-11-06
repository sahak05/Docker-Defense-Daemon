import React from "react";
import { useDashboardContext } from "../../../context/DashboardContext";
import styles from "../styles/dashboard.module.css";

/**
 * DashboardHeader
 *
 * Displays:
 * - Title and subtitle
 * - Daemon status indicator
 * - Dark mode toggle
 */

export const DashboardHeader: React.FC = () => {
  const { dashboardData } = useDashboardContext();

  if (!dashboardData) return null;

  const { daemonStatus } = dashboardData.summary;

  return (
    <header className={styles.header}>
      <div>
        <h1 className="text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Docker Defense Daemon Overview</p>
      </div>

      <div className={styles.headerActions}>
        {/* Daemon Status */}
        <div className={styles.daemonStatus}>
          <div
            className={`${styles.statusDot} ${styles[daemonStatus.status]}`}
          ></div>
          <span>Daemon {daemonStatus.status}</span>
        </div>
      </div>
    </header>
  );
};

DashboardHeader.displayName = "DashboardHeader";
