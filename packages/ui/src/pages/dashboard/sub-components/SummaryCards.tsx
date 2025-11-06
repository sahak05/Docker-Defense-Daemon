import React from "react";
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Server,
  Shield,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useDashboardContext } from "../../../context/DashboardContext";
import { getColor, getSeverityColor } from "../../../assets/styles/color";
import { formatUptime } from "../../../utils/formatters";
import colors from "../../../assets/styles/color";
import styles from "../styles/dashboard.module.css";

/**
 * SummaryCards
 *
 * Displays 4 key metric cards:
 * - Containers (total, running, stopped)
 * - Alerts (unresolved, critical, high)
 * - System Health (CPU, memory)
 * - Daemon Uptime (uptime, version)
 */

export const SummaryCards: React.FC = () => {
  const { isDarkMode, dashboardData, memoryPercentage } = useDashboardContext();

  if (!dashboardData) return null;

  const { summary } = dashboardData;

  return (
    <div className={styles.summaryGrid}>
      {/* Total Containers Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div
            className={styles.cardIcon}
            style={{
              backgroundColor: getColor("primary", "100", isDarkMode),
            }}
          >
            <Box size={24} color={getColor("primary", "600", isDarkMode)} />
          </div>
          <h3>Containers</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.mainStat}>{summary.containers.total}</div>
          <div className={styles.subStats}>
            <div className={styles.subStat}>
              <CheckCircle2 size={16} color={colors.success[500]} />
              <span>{summary.containers.running} running</span>
            </div>
            <div className={styles.subStat}>
              <XCircle size={16} color={colors.error[500]} />
              <span>{summary.containers.stopped} stopped</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div
            className={styles.cardIcon}
            style={{
              backgroundColor: getColor("warning", "100", isDarkMode),
            }}
          >
            <AlertTriangle
              size={24}
              color={getColor("warning", "600", isDarkMode)}
            />
          </div>
          <h3>Alerts</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.mainStat}>{summary.alerts.unresolved}</div>
          <div className={styles.subStats}>
            <div className={styles.subStat}>
              <div
                className={styles.severityDot}
                style={{ backgroundColor: getSeverityColor("critical") }}
              ></div>
              <span>{summary.alerts.critical} critical</span>
            </div>
            <div className={styles.subStat}>
              <div
                className={styles.severityDot}
                style={{ backgroundColor: getSeverityColor("high") }}
              ></div>
              <span>{summary.alerts.high} high</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div
            className={styles.cardIcon}
            style={{
              backgroundColor: getColor("success", "100", isDarkMode),
            }}
          >
            <Activity
              size={24}
              color={getColor("success", "600", isDarkMode)}
            />
          </div>
          <h3>System Health</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.mainStat}>
            {summary.systemMetrics.cpu.usage.toFixed(1)}%
          </div>
          <div className={styles.subStats}>
            <div className={styles.subStat}>
              <Server
                size={16}
                color={getColor("neutral", "500", isDarkMode)}
              />
              <span>CPU Usage</span>
            </div>
            <div className={styles.subStat}>
              <TrendingUp
                size={16}
                color={getColor("info", "500", isDarkMode)}
              />
              <span>{memoryPercentage}% Memory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daemon Uptime Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div
            className={styles.cardIcon}
            style={{
              backgroundColor: getColor("info", "100", isDarkMode),
            }}
          >
            <Clock size={24} color={getColor("info", "600", isDarkMode)} />
          </div>
          <h3>Uptime</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.mainStat}>
            {formatUptime(summary.daemonStatus.uptime)}
          </div>
          <div className={styles.subStats}>
            <div className={styles.subStat}>
              <Shield size={16} color={colors.success[500]} />
              <span>v{summary.daemonStatus.version}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SummaryCards.displayName = "SummaryCards";
