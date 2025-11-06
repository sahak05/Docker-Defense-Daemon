import React from "react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { formatTimestamp } from "../../../utils/formatters";
import styles from "../styles/dashboard.module.css";

/**
 * ActivityTimeline
 *
 * Displays timeline of recent activities with:
 * - Activity dots and connecting lines
 * - Activity message and timestamp
 */

export const ActivityTimeline: React.FC = () => {
  const { dashboardData } = useDashboardContext();

  if (!dashboardData) return null;

  const { recentActivity } = dashboardData;

  return (
    <div className={styles.activitySection}>
      <div className={styles.sectionHeader}>
        <h2>Recent Activity</h2>
      </div>
      <div className={styles.activityTimeline}>
        {recentActivity.map((activity, index) => (
          <div key={activity.id} className={styles.activityItem}>
            <div className={styles.activityDot}></div>
            {index < recentActivity.length - 1 && (
              <div className={styles.activityLine}></div>
            )}
            <div className={styles.activityContent}>
              <p>{activity.message}</p>
              <span className={styles.activityTime}>
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ActivityTimeline.displayName = "ActivityTimeline";
