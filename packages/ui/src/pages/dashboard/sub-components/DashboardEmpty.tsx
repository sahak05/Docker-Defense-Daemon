import React from "react";
import { AlertTriangle } from "lucide-react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { getColor } from "../../../assets/styles/color";
import styles from "../styles/dashboard.module.css";

/**
 * DashboardEmpty
 *
 * Displays loading or error states:
 * - Loading spinner with message
 * - Error state with troubleshooting steps
 */

export const DashboardEmpty: React.FC = () => {
  const { loading, error, isDarkMode } = useDashboardContext();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={48} color={getColor("error", "500", isDarkMode)} />
        <h2>Failed to Load Dashboard</h2>
        <p>{error || "No data available"}</p>
        <p
          style={{
            fontSize: "0.875rem",
            color: getColor("neutral", "500", isDarkMode),
            marginTop: "1rem",
          }}
        >
          Make sure your Flask backend is running:{" "}
          <code>docker compose up -d</code>
        </p>
      </div>
    );
  }

  return null;
};

DashboardEmpty.displayName = "DashboardEmpty";
