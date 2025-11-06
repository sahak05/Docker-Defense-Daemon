import React, { useMemo } from "react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { createStatusIconMap, getStatusIcon } from "../../../utils/iconHelpers";
import colors from "../../../assets/styles/color";
import type { ContainerStats } from "../../../types/dashboard";
import styles from "../styles/dashboard.module.css";

interface ContainerItemProps {
  container: ContainerStats;
  onClick: (id: string) => void;
}

/**
 * ContainerItem (Memoized)
 *
 * Renders a single container card with:
 * - Status icon and name
 * - CPU and Memory metrics with progress bars
 * - Color-coded thresholds (red for high usage)
 */

export const ContainerItem = React.memo<ContainerItemProps>(
  ({ container, onClick }) => {
    const { isDarkMode } = useDashboardContext();

    // Memoize status icons to prevent recalculation
    const statusIconMap = useMemo(
      () => createStatusIconMap(isDarkMode),
      [isDarkMode]
    );

    const statusIcon = useMemo(
      () => getStatusIcon(container.status, statusIconMap, isDarkMode),
      [container.status, statusIconMap, isDarkMode]
    );

    return (
      <div
        className={styles.containerItem}
        role="button"
        tabIndex={0}
        onClick={() => onClick(container.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick(container.id);
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <div className={styles.containerHeader}>
          {statusIcon}
          <div className={styles.containerInfo}>
            <h4>{container.name}</h4>
            <p>{container.image}</p>
          </div>
        </div>
        <div className={styles.containerMetrics}>
          {/* CPU Metric */}
          <div className={styles.metric}>
            <span className={styles.metricLabel}>CPU</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${container.cpu}%`,
                  backgroundColor:
                    container.cpu > 80
                      ? colors.error[500]
                      : colors.primary[500],
                }}
              ></div>
            </div>
            <span className={styles.metricValue}>
              {container.cpu.toFixed(1)}%
            </span>
          </div>

          {/* Memory Metric */}
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Memory</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${(container.memory / container.memoryLimit) * 100}%`,
                  backgroundColor:
                    container.memory / container.memoryLimit > 0.8
                      ? colors.error[500]
                      : colors.success[500],
                }}
              ></div>
            </div>
            <span className={styles.metricValue}>
              {(container.memory / 1024).toFixed(1)} /{" "}
              {(container.memoryLimit / 1024).toFixed(1)} GB
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ContainerItem.displayName = "ContainerItem";
