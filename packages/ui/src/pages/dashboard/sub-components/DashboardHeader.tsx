import React from "react";
import { Moon, Sun } from "lucide-react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { getColor } from "../../../assets/styles/color";
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
  const { isDarkMode, onToggleDarkMode, dashboardData } = useDashboardContext();

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

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={styles.themeToggle}
          aria-label="Toggle theme"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            marginLeft: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDarkMode ? (
            <Sun size={22} color={getColor("warning", "700", isDarkMode)} />
          ) : (
            <Moon size={22} color={getColor("neutral", "700", isDarkMode)} />
          )}
        </button>
      </div>
    </header>
  );
};

DashboardHeader.displayName = "DashboardHeader";
