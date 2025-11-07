import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { AlertItem } from "./AlertItem";
import { getColor } from "../../../assets/styles/color";
import type { ContainerAlert } from "../../../types/containerAlert";
import styles from "../styles/dashboard.module.css";

/**
 * AlertsSection
 *
 * Displays list of recent alerts (max 5) with:
 * - Empty state when no alerts
 * - AlertItem components for each alert
 * - View All button to navigate to alerts page
 */

export const AlertsSection: React.FC = () => {
  const { isDarkMode, dashboardData, onNavigate } = useDashboardContext();

  if (!dashboardData) return null;

  const { recentAlerts } = dashboardData;

  const handleAlertClick = (alertId: string) => {
    onNavigate("alerts", alertId);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Recent Alerts</h2>
        <button
          className={styles.linkButton}
          onClick={() => onNavigate("alerts")}
        >
          View All
        </button>
      </div>
      <div className={styles.alertsList}>
        {recentAlerts.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2
              size={48}
              color={getColor("success", "500", isDarkMode)}
            />
            <p>No recent alerts</p>
          </div>
        ) : (
          recentAlerts.slice(0, 5).map((a) => {
            const alert = a as unknown as ContainerAlert;
            return (
              <AlertItem
                key={alert.id}
                alert={alert}
                onClick={handleAlertClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

AlertsSection.displayName = "AlertsSection";
