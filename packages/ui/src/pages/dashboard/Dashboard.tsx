import React, { useState, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";
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
import type { DashboardData } from "../../types/dashboard";
import colors, {
  getColor,
  getSeverityColor,
  getStatusColor,
} from "../../assets/styles/color";
import { mockDashboardData } from "../../utils/mockData";

interface DashboardProps {
  useMockData?: boolean;
  isDarkMode?: boolean; // accept optional prop from parent App
  onToggleDarkMode?: () => void;
  onNavigate?: (page: string, itemId?: string) => void; // added navigation prop
}

const Dashboard: React.FC<DashboardProps> = ({
  useMockData = true,
  isDarkMode: propIsDarkMode,
  onToggleDarkMode,
  onNavigate,
}) => {
  const themeHook = useTheme();
  // effectiveDark prefers prop, falls back to theme hook
  const effectiveDark =
    typeof propIsDarkMode === "boolean" ? propIsDarkMode : themeHook.isDarkMode;
  const toggleTheme = onToggleDarkMode ?? themeHook.toggle;

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

  // Use shared `getSeverityColor` from the color helpers (imported above)

  const getStatusIcon = (status: string): React.ReactElement => {
    const statusIcons: Record<string, React.ReactElement> = {
      running: (
        <CheckCircle2
          size={20}
          color={getStatusColor("running", effectiveDark)}
        />
      ),
      stopped: (
        <XCircle size={20} color={getStatusColor("stopped", effectiveDark)} />
      ),
      paused: (
        <PauseCircle
          size={20}
          color={getStatusColor("paused", effectiveDark)}
        />
      ),
    };

    return (
      statusIcons[status] || (
        <Activity size={20} color={getColor("neutral", "500", effectiveDark)} />
      )
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
        <AlertTriangle
          size={48}
          color={getColor("error", "500", effectiveDark)}
        />
        <h2>Failed to Load Dashboard</h2>
        <p>{error || "No data available"}</p>
        <p
          style={{
            fontSize: "0.875rem",
            color: getColor("neutral", "500", effectiveDark),
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
        effectiveDark ? styles.dark : styles.light
      }`}
    >
      {/* Development Mode Indicator */}
      {useMockData && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "5rem",
            backgroundColor: getColor("warning", "100", effectiveDark),
            color: getColor("warning", "900", effectiveDark),
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
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Toggle theme"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              marginLeft: "1rem",
            }}
          >
            {effectiveDark ? (
              <Sun
                size={22}
                color={getColor("warning", "700", effectiveDark)}
              />
            ) : (
              <Moon
                size={22}
                color={getColor("neutral", "700", effectiveDark)}
              />
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
              style={{
                backgroundColor: getColor("primary", "100", effectiveDark),
              }}
            >
              <Box
                size={24}
                color={getColor("primary", "600", effectiveDark)}
              />
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
                backgroundColor: getColor("warning", "100", effectiveDark),
              }}
            >
              <AlertTriangle
                size={24}
                color={getColor("warning", "600", effectiveDark)}
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
                backgroundColor: getColor("success", "100", effectiveDark),
              }}
            >
              <Activity
                size={24}
                color={getColor("success", "600", effectiveDark)}
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
                  color={getColor("neutral", "500", effectiveDark)}
                />
                <span>CPU Usage</span>
              </div>
              <div className={styles.subStat}>
                <TrendingUp
                  size={16}
                  color={getColor("info", "500", effectiveDark)}
                />
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
              style={{
                backgroundColor: getColor("info", "100", effectiveDark),
              }}
            >
              <Clock size={24} color={getColor("info", "600", effectiveDark)} />
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
            <button
              className={styles.linkButton}
              onClick={() => onNavigate?.("alerts")}
            >
              View All
            </button>
          </div>
          <div className={styles.alertsList}>
            {recentAlerts.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2
                  size={48}
                  color={getColor("success", "500", effectiveDark)}
                />
                <p>No recent alerts</p>
              </div>
            ) : (
              recentAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={styles.alertItem}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate?.("alerts", alert.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onNavigate?.("alerts", alert.id);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
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
            <button
              className={styles.linkButton}
              onClick={() => onNavigate?.("containers")}
            >
              View All
            </button>
          </div>
          <div className={styles.containersList}>
            {topContainers.map((container) => (
              <div
                key={container.id}
                className={styles.containerItem}
                role="button"
                tabIndex={0}
                onClick={() => onNavigate?.("containers", container.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onNavigate?.("containers", container.id);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
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
