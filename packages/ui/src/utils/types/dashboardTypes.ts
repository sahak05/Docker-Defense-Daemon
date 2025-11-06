// src/utils/types/dashboardTypes.ts

export interface DashboardStats {
  daemon: string;
  uptime_seconds: number;
  docker_connected: boolean;
  docker_version: string;
  api_version: string;
  alerts_count: number;
  alerts_file: string;
}

export interface AlertInfo {
  source: string;
  timestamp: string;
  rule: string;
  summary: string;
  severity: "critical" | "warning" | "info" | "medium" | string;
  container: {
    id: string;
    name: string;
    image: string;
  };
  action_taken?: string;
  detected_risks?: string[];
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  cpu_usage?: number;
  memory_usage?: number;
  status?: string;
  created?: string;
}
