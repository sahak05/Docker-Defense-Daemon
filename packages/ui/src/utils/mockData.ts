// src/utils/mockData.ts
/**
 * Mock data for testing the Dashboard component
 * Replace with real API calls in production
 */

import type { DashboardData } from "../types/dashboard";

export const mockDashboardData: DashboardData = {
  summary: {
    containers: {
      total: 12,
      running: 8,
      stopped: 3,
      paused: 1,
      error: 0,
    },
    alerts: {
      total: 23,
      critical: 2,
      high: 5,
      medium: 8,
      low: 8,
      unresolved: 7,
    },
    daemonStatus: {
      status: "running",
      uptime: 345600, // 4 days
      version: "1.2.0",
      lastHealthCheck: new Date().toISOString(),
      dockerEngineVersion: "24.0.7",
      falcoStatus: "active",
      trivyStatus: "active",
    },
    systemMetrics: {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: 45.8,
        cores: 8,
      },
      memory: {
        used: 12288, // 12 GB in MB
        total: 16384, // 16 GB in MB
        percentage: 75,
      },
      disk: {
        used: 120,
        total: 500,
        percentage: 24,
      },
      network: {
        rx: 1048576, // 1 MB/s in bytes
        tx: 524288, // 512 KB/s in bytes
      },
    },
  },
  recentAlerts: [
    {
      id: "alert-001",
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      type: "security",
      severity: "critical",
      title: "Privileged Container Detected",
      description:
        "Container nginx-prod is running with --privileged flag, granting full host access.",
      containerId: "a1b2c3d4e5f6",
      containerName: "nginx-prod",
      status: "new",
      metadata: {
        capabilities: ["SYS_ADMIN", "NET_ADMIN"],
        privileged: true,
      },
    },
    {
      id: "alert-002",
      timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
      type: "security",
      severity: "high",
      title: "Docker Socket Mount Detected",
      description:
        "Container jenkins-master has /var/run/docker.sock mounted, allowing Docker API access.",
      containerId: "b2c3d4e5f6g7",
      containerName: "jenkins-master",
      status: "acknowledged",
      metadata: {
        mountPath: "/var/run/docker.sock",
      },
    },
    {
      id: "alert-003",
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      type: "performance",
      severity: "medium",
      title: "High Memory Usage",
      description:
        "Container postgres-db is using 92% of allocated memory (7.4 GB / 8 GB).",
      containerId: "c3d4e5f6g7h8",
      containerName: "postgres-db",
      status: "acknowledged",
      metadata: {
        memoryUsage: 92,
        memoryLimit: 8192,
      },
    },
    {
      id: "alert-004",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      type: "security",
      severity: "high",
      title: "Suspicious Shell Spawned",
      description:
        "Falco detected shell spawning in container web-app-1 - potential security breach.",
      containerId: "d4e5f6g7h8i9",
      containerName: "web-app-1",
      status: "resolved",
      metadata: {
        processName: "/bin/bash",
        user: "www-data",
      },
    },
    {
      id: "alert-005",
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      type: "compliance",
      severity: "low",
      title: "Container Running as Root",
      description:
        "Container redis-cache is running with root user (UID 0), violating security policy.",
      containerId: "e5f6g7h8i9j0",
      containerName: "redis-cache",
      status: "resolved",
      metadata: {
        user: "root",
        uid: 0,
      },
    },
  ],
  recentActivity: [
    {
      id: "activity-001",
      timestamp: new Date(Date.now() - 180000).toISOString(), // 3 min ago
      type: "container_start",
      message: "Container nginx-prod started successfully",
      containerId: "a1b2c3d4e5f6",
      severity: "info",
    },
    {
      id: "activity-002",
      timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
      type: "alert_triggered",
      message: "Critical alert: Privileged container detected in nginx-prod",
      containerId: "a1b2c3d4e5f6",
      severity: "error",
    },
    {
      id: "activity-003",
      timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
      type: "container_restart",
      message: "Container postgres-db restarted due to OOM error",
      containerId: "c3d4e5f6g7h8",
      severity: "warning",
    },
    {
      id: "activity-004",
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      type: "image_pulled",
      message: "Image nginx:latest pulled successfully",
      severity: "info",
    },
    {
      id: "activity-005",
      timestamp: new Date(Date.now() - 2400000).toISOString(), // 40 min ago
      type: "container_stop",
      message: "Container old-app stopped and removed",
      containerId: "z9y8x7w6v5u4",
      severity: "info",
    },
  ],
  topContainers: [
    {
      id: "a1b2c3d4e5f6",
      name: "nginx-prod",
      status: "running",
      image: "nginx:1.25-alpine",
      cpu: 78.5,
      memory: 512, // MB
      memoryLimit: 1024, // MB
      network: {
        rx: 2048576, // 2 MB
        tx: 1048576, // 1 MB
      },
      uptime: 86400, // 1 day
    },
    {
      id: "c3d4e5f6g7h8",
      name: "postgres-db",
      status: "running",
      image: "postgres:15",
      cpu: 65.2,
      memory: 7372, // ~7.2 GB
      memoryLimit: 8192, // 8 GB
      network: {
        rx: 524288,
        tx: 262144,
      },
      uptime: 172800, // 2 days
    },
    {
      id: "b2c3d4e5f6g7",
      name: "jenkins-master",
      status: "running",
      image: "jenkins/jenkins:lts",
      cpu: 42.8,
      memory: 2048, // 2 GB
      memoryLimit: 4096, // 4 GB
      network: {
        rx: 131072,
        tx: 65536,
      },
      uptime: 259200, // 3 days
    },
    {
      id: "d4e5f6g7h8i9",
      name: "web-app-1",
      status: "running",
      image: "node:20-alpine",
      cpu: 38.1,
      memory: 768, // MB
      memoryLimit: 2048, // 2 GB
      network: {
        rx: 1048576,
        tx: 524288,
      },
      uptime: 43200, // 12 hours
    },
    {
      id: "e5f6g7h8i9j0",
      name: "redis-cache",
      status: "running",
      image: "redis:7-alpine",
      cpu: 25.4,
      memory: 256, // MB
      memoryLimit: 512, // MB
      network: {
        rx: 262144,
        tx: 131072,
      },
      uptime: 345600, // 4 days
    },
  ],
};

/**
 * Simulate API call delay
 */
export async function fetchDashboardData(): Promise<typeof mockDashboardData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockDashboardData;
}

/**
 * Generate random dashboard data for testing real-time updates
 */
export function generateRandomDashboardData(): DashboardData {
  const data = JSON.parse(JSON.stringify(mockDashboardData)) as DashboardData;

  // Randomize some values
  data.summary.systemMetrics.cpu.usage = Math.random() * 100;
  data.summary.systemMetrics.memory.percentage = Math.random() * 100;

  data.topContainers = data.topContainers.map((container) => ({
    ...container,
    cpu: Math.random() * 100,
    memory: container.memory + (Math.random() - 0.5) * 100,
  }));

  return data;
}
