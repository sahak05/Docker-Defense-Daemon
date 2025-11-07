import React, { useMemo } from "react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { formatTimestamp } from "../../../utils/formatters";
import { getSeverityColor } from "../../../assets/styles/color";
import { getSeverityScore } from "../../../utils/iconHelpers";
import type { ContainerAlert } from "../../../types/containerAlert";
import styles from "../styles/dashboard.module.css";

interface AlertItemProps {
  alert: ContainerAlert;
  onClick: (id: string) => void;
}

/**
 * AlertItem (Memoized)
 *
 * Renders a single container alert with:
 * - Highest severity risk display
 * - Risk count and Trivy vulnerability count
 * - Timestamp formatting
 * - Severity badge
 */

export const AlertItem = React.memo<AlertItemProps>(({ alert, onClick }) => {
  const { isDarkMode } = useDashboardContext();

  // Compute highest severity risk (memoized to prevent recalc)
  const highestSeverityRisk = useMemo(() => {
    if (!alert?.risks || alert.risks.length === 0) {
      return { description: "No risks detected", severity: "low" } as any;
    }
    return alert.risks.reduce((highest, current) => {
      const curScore = getSeverityScore(current.severity);
      const highScore = getSeverityScore(highest.severity);
      return curScore > highScore ? current : highest;
    }, alert.risks[0]);
  }, [alert.risks]);

  return (
    <div
      className={styles.alertItem}
      role="button"
      tabIndex={0}
      onClick={() => onClick(alert.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(alert.id);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <div
        className={styles.alertSeverity}
        style={{
          backgroundColor: getSeverityColor(highestSeverityRisk.severity),
        }}
      />
      <div className={styles.alertContent}>
        <h4>{`${alert.action?.toUpperCase() ?? "ALERT"} - ${
          alert.image ?? "unknown"
        }`}</h4>
        <p>{highestSeverityRisk.description}</p>
        <div className={styles.alertMeta}>
          <span className={styles.timestamp}>
            {formatTimestamp(alert.log_time)}
          </span>
          <span className={styles.riskCount}>
            {alert.risks?.length ?? 0} risks detected
          </span>
          {alert.trivy?.high_or_critical ? (
            <span className={styles.trivyAlert}>
              {alert.trivy.high_or_critical} critical vulnerabilities
            </span>
          ) : null}
        </div>
      </div>
      <div className={styles.alertStatus}>
        <span
          className={`${styles.badge} ${styles[highestSeverityRisk.severity]}`}
        >
          {highestSeverityRisk.severity}
        </span>
      </div>
    </div>
  );
});

AlertItem.displayName = "AlertItem";
