// src/types/dashboard.types.ts

export interface ContainerStats {
  id: string;
  name: string;
  status: "running" | "stopped" | "paused" | "restarting" | "exited" | "dead";
  image: string;
  cpu: number; // percentage
  memory: number; // in MB
  memoryLimit: number; // in MB
  network: {
    rx: number; // bytes received
    tx: number; // bytes transmitted
  };
  uptime: number; // in seconds
}

export interface Alert {
  id: string;
  timestamp: string;
  type: "security" | "performance" | "compliance" | "system";
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  containerId?: string;
  containerName?: string;
  status: "new" | "acknowledged" | "resolved";
  metadata?: Record<string, unknown>;
}

export interface DaemonStatus {
  status: "running" | "stopped" | "error" | "starting";
  uptime: number; // in seconds
  version: string;
  lastHealthCheck: string;
  dockerEngineVersion?: string;
  falcoStatus?: "active" | "inactive" | "error";
  trivyStatus?: "active" | "inactive" | "error";
}

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number; // percentage
    cores: number;
  };
  memory: {
    used: number; // in MB
    total: number; // in MB
    percentage: number;
  };
  disk: {
    used: number; // in GB
    total: number; // in GB
    percentage: number;
  };
  network: {
    rx: number; // bytes/sec
    tx: number; // bytes/sec
  };
}

export interface DashboardSummary {
  containers: {
    total: number;
    running: number;
    stopped: number;
    paused: number;
    error: number;
  };
  alerts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unresolved: number;
  };
  daemonStatus: DaemonStatus;
  systemMetrics: SystemMetrics;
}

export interface RecentActivity {
  id: string;
  timestamp: string;
  type:
    | "container_start"
    | "container_stop"
    | "alert_triggered"
    | "container_restart"
    | "image_pulled";
  message: string;
  containerId?: string;
  severity?: "info" | "warning" | "error";
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentAlerts: Alert[];
  recentActivity: RecentActivity[];
  topContainers: ContainerStats[]; // Top 5 by resource usage
}
