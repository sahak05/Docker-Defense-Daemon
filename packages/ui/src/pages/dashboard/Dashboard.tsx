import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  XCircle,
  PauseCircle,
  TrendingUp,
  Server,
  Shield,
  Clock,
  Moon,
  Sun,
} from "lucide-react";
import styles from "./styles/dashboard.module.css";
import type { Alert, DashboardData } from "../../types/dashboard";
import colors from "../../assets/styles/color";
import { mockDashboardData } from "../../utils/mockData";

interface DashboardProps {
  isDarkMode?: boolean;
  useMockData?: boolean;
  onToggleDarkMode?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  isDarkMode = false,
  useMockData = true,
  onToggleDarkMode,
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // If using mock data, skip the API call
        if (useMockData) {
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 500));
          setDashboardData(mockDashboardData);
          setError(null);
          setLoading(false);
          return;
        }

        // Try to fetch from API
        const response = await fetch("/api/dashboard");

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Server returned non-JSON response. Is the backend running?"
          );
        }

        const data = await response.json();
        setDashboardData(data.data);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Dashboard fetch error:", err);

        // Fallback to mock data on error
        console.warn("Falling back to mock data...");
        setDashboardData(mockDashboardData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Poll every 5 seconds (only if not using mock data)
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!useMockData) {
      interval = setInterval(fetchDashboardData, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useMockData]);

  const getSeverityColor = (severity: Alert["severity"]): string => {
    const severityColors: Record<Alert["severity"], string> = {
      critical: colors.severity.critical,
      high: colors.severity.high,
      medium: colors.severity.medium,
      low: colors.severity.low,
      info: colors.severity.info,
    };

    return severityColors[severity] || colors.neutral[500];
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    const statusIcons: Record<string, React.ReactElement> = {
      running: <CheckCircle2 size={20} color={colors.status.running} />,
      stopped: <XCircle size={20} color={colors.status.stopped} />,
      paused: <PauseCircle size={20} color={colors.status.paused} />,
    };

    return (
      statusIcons[status] || <Activity size={20} color={colors.neutral[500]} />
    );
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={48} color={colors.error[500]} />
        <h2>Failed to Load Dashboard</h2>
        <p>{error || "No data available"}</p>
        <p
          style={{
            fontSize: "0.875rem",
            color: colors.neutral[500],
            marginTop: "1rem",
          }}
        >
          Make sure your Flask backend is running:{" "}
          <code>docker compose up -d</code>
        </p>
      </div>
    );
  }

  const { summary, recentAlerts, recentActivity, topContainers } =
    dashboardData;

  return (
    <div
      className={`${styles.dashboard} ${
        isDarkMode ? styles.dark : styles.light
      }`}
    >
      {/* Development Mode Indicator */}
      {useMockData && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            backgroundColor: colors.warning[100],
            color: colors.warning[900],
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          🔧 Using Mock Data
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Docker Defense Daemon Overview</p>
        </div>

        <div className={styles.headerActions}>
          {/* Daemon Status */}
          <div className={styles.daemonStatus}>
            <div
              className={`${styles.statusDot} ${
                styles[summary.daemonStatus.status]
              }`}
            ></div>
            <span>Daemon {summary.daemonStatus.status}</span>
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
            }}
          >
            {isDarkMode ? (
              <Sun size={22} color={colors.warning[700]} />
            ) : (
              <Moon size={22} color={colors.neutral[700]} />
            )}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {/* Total Containers Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div
              className={styles.cardIcon}
              style={{ backgroundColor: colors.primary[100] }}
            >
              <Box size={24} color={colors.primary[600]} />
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
              style={{ backgroundColor: colors.warning[100] }}
            >
              <AlertTriangle size={24} color={colors.warning[600]} />
            </div>
            <h3>Alerts</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.mainStat}>{summary.alerts.unresolved}</div>
            <div className={styles.subStats}>
              <div className={styles.subStat}>
                <div
                  className={styles.severityDot}
                  style={{ backgroundColor: colors.severity.critical }}
                ></div>
                <span>{summary.alerts.critical} critical</span>
              </div>
              <div className={styles.subStat}>
                <div
                  className={styles.severityDot}
                  style={{ backgroundColor: colors.severity.high }}
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
              style={{ backgroundColor: colors.success[100] }}
            >
              <Activity size={24} color={colors.success[600]} />
            </div>
            <h3>System Health</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.mainStat}>
              {summary.systemMetrics.cpu.usage.toFixed(1)}%
            </div>
            <div className={styles.subStats}>
              <div className={styles.subStat}>
                <Server size={16} color={colors.neutral[500]} />
                <span>CPU Usage</span>
              </div>
              <div className={styles.subStat}>
                <TrendingUp size={16} color={colors.info[500]} />
                <span>
                  {summary.systemMetrics.memory.percentage.toFixed(1)}% Memory
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daemon Uptime Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div
              className={styles.cardIcon}
              style={{ backgroundColor: colors.info[100] }}
            >
              <Clock size={24} color={colors.info[600]} />
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

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Alerts */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Alerts</h2>
            <button className={styles.linkButton}>View All</button>
          </div>
          <div className={styles.alertsList}>
            {recentAlerts.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2 size={48} color={colors.success[500]} />
                <p>No recent alerts</p>
              </div>
            ) : (
              recentAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={styles.alertItem}>
                  <div
                    className={styles.alertSeverity}
                    style={{
                      backgroundColor: getSeverityColor(alert.severity),
                    }}
                  ></div>
                  <div className={styles.alertContent}>
                    <h4>{alert.title}</h4>
                    <p>{alert.description}</p>
                    <div className={styles.alertMeta}>
                      <span className={styles.timestamp}>
                        {formatTimestamp(alert.timestamp)}
                      </span>
                      {alert.containerName && (
                        <span className={styles.containerTag}>
                          <Box size={14} />
                          {alert.containerName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.alertStatus}>
                    <span className={`${styles.badge} ${styles[alert.status]}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Containers by Resource Usage */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Top Containers</h2>
            <button className={styles.linkButton}>View All</button>
          </div>
          <div className={styles.containersList}>
            {topContainers.map((container) => (
              <div key={container.id} className={styles.containerItem}>
                <div className={styles.containerHeader}>
                  {getStatusIcon(container.status)}
                  <div className={styles.containerInfo}>
                    <h4>{container.name}</h4>
                    <p>{container.image}</p>
                  </div>
                </div>
                <div className={styles.containerMetrics}>
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
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Memory</span>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${
                            (container.memory / container.memoryLimit) * 100
                          }%`,
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
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
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
    </div>
  );
};

export default Dashboard;
