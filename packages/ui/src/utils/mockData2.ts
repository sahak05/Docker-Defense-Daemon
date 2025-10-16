// Mock data for the Docker monitoring dashboard

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'exited' | 'paused';
  uptime: string;
  cpu: number;
  memory: number;
  memoryLimit: number;
  lastEvent: string;
  created: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  container: string;
  status: 'new' | 'acknowledged' | 'resolved';
  description: string;
  details: string;
  suggestedAction?: string;
}

export interface EventLog {
  id: string;
  timestamp: string;
  type: string;
  container?: string;
  message: string;
  details?: string;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
}

export const mockContainers: Container[] = [
  {
    id: 'a1b2c3d4',
    name: 'nginx-prod',
    image: 'nginx:1.25-alpine',
    status: 'running',
    uptime: '4d 2h 15m',
    cpu: 78.3,
    memory: 6.7,
    memoryLimit: 8,
    lastEvent: 'Started',
    created: '2025-10-11T10:30:00Z'
  },
  {
    id: 'e5f6g7h8',
    name: 'postgres-db',
    image: 'postgres:16',
    status: 'running',
    uptime: '4d 0h 5m',
    cpu: 67.2,
    memory: 7.4,
    memoryLimit: 8,
    lastEvent: 'Health check passed',
    created: '2025-10-11T12:45:00Z'
  },
  {
    id: 'i9j0k1l2',
    name: 'jenkins-master',
    image: 'jenkins/jenkins:lts',
    status: 'running',
    uptime: '3d 18h 42m',
    cpu: 42.3,
    memory: 2.8,
    memoryLimit: 4,
    lastEvent: 'Started',
    created: '2025-10-11T20:00:00Z'
  },
  {
    id: 'm3n4o5p6',
    name: 'web-app-1',
    image: 'node:20-alpine',
    status: 'running',
    uptime: '2d 6h 30m',
    cpu: 15.8,
    memory: 1.2,
    memoryLimit: 2,
    lastEvent: 'Restarted',
    created: '2025-10-13T08:00:00Z'
  },
  {
    id: 'q7r8s9t0',
    name: 'redis-cache',
    image: 'redis:7-alpine',
    status: 'running',
    uptime: '4d 0h 0m',
    cpu: 23.5,
    memory: 0.8,
    memoryLimit: 1,
    lastEvent: 'Started',
    created: '2025-10-11T12:30:00Z'
  },
  {
    id: 'u1v2w3x4',
    name: 'mongodb-primary',
    image: 'mongo:7',
    status: 'running',
    uptime: '3d 22h 10m',
    cpu: 54.1,
    memory: 3.2,
    memoryLimit: 4,
    lastEvent: 'Health check passed',
    created: '2025-10-11T14:20:00Z'
  },
  {
    id: 'y5z6a7b8',
    name: 'prometheus',
    image: 'prom/prometheus:latest',
    status: 'running',
    uptime: '4d 0h 5m',
    cpu: 12.4,
    memory: 1.5,
    memoryLimit: 2,
    lastEvent: 'Started',
    created: '2025-10-11T12:45:00Z'
  },
  {
    id: 'c9d0e1f2',
    name: 'grafana',
    image: 'grafana/grafana:latest',
    status: 'running',
    uptime: '4d 0h 3m',
    cpu: 8.2,
    memory: 0.9,
    memoryLimit: 1,
    lastEvent: 'Started',
    created: '2025-10-11T12:47:00Z'
  },
  {
    id: 'g3h4i5j6',
    name: 'api-gateway',
    image: 'nginx:1.25-alpine',
    status: 'running',
    uptime: '1d 12h 0m',
    cpu: 34.7,
    memory: 0.6,
    memoryLimit: 1,
    lastEvent: 'Restarted',
    created: '2025-10-14T00:00:00Z'
  },
  {
    id: 'k7l8m9n0',
    name: 'backup-worker',
    image: 'alpine:latest',
    status: 'exited',
    uptime: '0m',
    cpu: 0,
    memory: 0,
    memoryLimit: 0.5,
    lastEvent: 'Exited with code 0',
    created: '2025-10-15T02:00:00Z'
  },
  {
    id: 'o1p2q3r4',
    name: 'ml-processor',
    image: 'python:3.11-slim',
    status: 'paused',
    uptime: '8h 45m',
    cpu: 0,
    memory: 2.1,
    memoryLimit: 4,
    lastEvent: 'Paused',
    created: '2025-10-15T04:00:00Z'
  },
  {
    id: 's5t6u7v8',
    name: 'nginx-staging',
    image: 'nginx:1.24-alpine',
    status: 'running',
    uptime: '18h 30m',
    cpu: 5.3,
    memory: 0.3,
    memoryLimit: 0.5,
    lastEvent: 'Started',
    created: '2025-10-14T18:00:00Z'
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    timestamp: '2025-10-15T08:42:15Z',
    type: 'Privileged Container Detected',
    severity: 'critical',
    container: 'nginx-prod',
    status: 'new',
    description: 'Container nginx-prod is running with --privileged flag, granting full host access.',
    details: 'This container has unrestricted access to all devices and can perform operations typically reserved for the host. This poses a significant security risk.',
    suggestedAction: 'Review container requirements and remove --privileged flag if not necessary. Use specific capabilities instead.'
  },
  {
    id: 'alert-002',
    timestamp: '2025-10-15T07:15:30Z',
    type: 'Docker Socket Mount Detected',
    severity: 'critical',
    container: 'jenkins-master',
    status: 'acknowledged',
    description: 'Container jenkins-master has /var/run/docker.sock mounted, allowing Docker API access.',
    details: 'Mounting the Docker socket gives this container the ability to control the Docker daemon, potentially allowing container escapes.',
    suggestedAction: 'Consider using Docker-in-Docker or a dedicated CI/CD solution with proper isolation.'
  },
  {
    id: 'alert-003',
    timestamp: '2025-10-15T06:22:10Z',
    type: 'High Memory Usage',
    severity: 'warning',
    container: 'postgres-db',
    status: 'acknowledged',
    description: 'Container postgres-db is using 92% of allocated memory (7.4 GB / 8.0 GB).',
    details: 'Memory usage has been above 90% for the past 30 minutes. This may lead to OOM kills.',
    suggestedAction: 'Consider increasing memory limits or investigating potential memory leaks.'
  },
  {
    id: 'alert-004',
    timestamp: '2025-10-15T05:10:45Z',
    type: 'Suspicious Shell Spawned',
    severity: 'critical',
    container: 'web-app-1',
    status: 'resolved',
    description: 'Falco detected a shell spawning in container with web-app-1: potential security breach.',
    details: 'An interactive shell (/bin/bash) was spawned inside the container, which is unusual for a production web application.',
    suggestedAction: 'Investigate container logs and recent access patterns. Consider implementing runtime security policies.'
  },
  {
    id: 'alert-005',
    timestamp: '2025-10-15T03:45:00Z',
    type: 'Container Restart Loop',
    severity: 'warning',
    container: 'api-gateway',
    status: 'resolved',
    description: 'Container api-gateway has restarted 5 times in the last hour.',
    details: 'Repeated restarts indicate a potential application crash or misconfiguration.',
    suggestedAction: 'Check container logs for errors and review application health checks.'
  },
  {
    id: 'alert-006',
    timestamp: '2025-10-15T02:30:20Z',
    type: 'High CPU Usage',
    severity: 'warning',
    container: 'nginx-prod',
    status: 'new',
    description: 'Container nginx-prod CPU usage above 75% for 10 minutes.',
    details: 'Sustained high CPU usage may indicate increased load or a runaway process.',
    suggestedAction: 'Monitor traffic patterns and consider scaling horizontally.'
  },
  {
    id: 'alert-007',
    timestamp: '2025-10-15T01:15:00Z',
    type: 'Unusual Network Activity',
    severity: 'warning',
    container: 'mongodb-primary',
    status: 'acknowledged',
    description: 'Abnormal outbound network traffic detected from mongodb-primary.',
    details: 'Container has sent 2.5 GB of data in the last hour, which is 300% above baseline.',
    suggestedAction: 'Verify if this is expected behavior or investigate for potential data exfiltration.'
  },
  {
    id: 'alert-008',
    timestamp: '2025-10-14T22:00:00Z',
    type: 'Image Vulnerability Detected',
    severity: 'info',
    container: 'nginx-staging',
    status: 'new',
    description: 'Container image nginx:1.24-alpine contains 3 medium-severity vulnerabilities.',
    details: 'Security scan found CVE-2023-XXXX, CVE-2023-YYYY, and CVE-2023-ZZZZ.',
    suggestedAction: 'Update to nginx:1.25-alpine or apply security patches.'
  }
];

export const mockEventLogs: EventLog[] = [
  {
    id: 'event-001',
    timestamp: '2025-10-15T09:00:00Z',
    type: 'Container Started',
    container: 'nginx-staging',
    message: 'Container nginx-staging started successfully',
    details: 'Container ID: s5t6u7v8, Image: nginx:1.24-alpine'
  },
  {
    id: 'event-002',
    timestamp: '2025-10-15T08:45:30Z',
    type: 'Alert Created',
    container: 'nginx-prod',
    message: 'New critical alert: Privileged Container Detected',
    details: 'Alert ID: alert-001'
  },
  {
    id: 'event-003',
    timestamp: '2025-10-15T08:30:15Z',
    type: 'Health Check',
    container: 'postgres-db',
    message: 'Health check passed for postgres-db',
    details: 'Status: healthy, Response time: 45ms'
  },
  {
    id: 'event-004',
    timestamp: '2025-10-15T08:15:00Z',
    type: 'Daemon Event',
    message: 'Monitoring daemon started',
    details: 'Version: v1.2.0, Mode: Production'
  },
  {
    id: 'event-005',
    timestamp: '2025-10-15T07:30:20Z',
    type: 'Container Restarted',
    container: 'api-gateway',
    message: 'Container api-gateway restarted',
    details: 'Restart count: 1, Reason: Manual restart'
  },
  {
    id: 'event-006',
    timestamp: '2025-10-15T07:00:00Z',
    type: 'Image Pulled',
    message: 'Docker image pulled: redis:7-alpine',
    details: 'Size: 32.5 MB, Layers: 6'
  },
  {
    id: 'event-007',
    timestamp: '2025-10-15T06:45:10Z',
    type: 'Alert Acknowledged',
    container: 'jenkins-master',
    message: 'Alert acknowledged: Docker Socket Mount Detected',
    details: 'Alert ID: alert-002, Acknowledged by: System Admin'
  },
  {
    id: 'event-008',
    timestamp: '2025-10-15T06:30:00Z',
    type: 'Metrics Collected',
    message: 'System metrics collected for all containers',
    details: 'Containers monitored: 12, Metrics points: 384'
  },
  {
    id: 'event-009',
    timestamp: '2025-10-15T06:00:00Z',
    type: 'Container Stopped',
    container: 'backup-worker',
    message: 'Container backup-worker stopped',
    details: 'Exit code: 0, Duration: 5m 23s'
  },
  {
    id: 'event-010',
    timestamp: '2025-10-15T05:45:00Z',
    type: 'Alert Resolved',
    container: 'web-app-1',
    message: 'Alert resolved: Suspicious Shell Spawned',
    details: 'Alert ID: alert-004, Resolution: Authorized maintenance'
  }
];

export const mockSystemHealth: SystemHealth = {
  cpuUsage: 45.8,
  memoryUsage: 75.0,
  diskUsage: 62.3,
  networkIn: 125.4,
  networkOut: 87.2
};

export const mockDaemonInfo = {
  status: 'running',
  uptime: '4d 0h 15m',
  version: 'v1.2.0',
  hostOS: 'Ubuntu 22.04.3 LTS',
  dockerVersion: '24.0.6',
  pollingInterval: 5000,
  lastCheck: '2025-10-15T09:00:00Z'
};

// Helper function to get container by ID
export const getContainerById = (id: string): Container | undefined => {
  return mockContainers.find(c => c.id === id);
};

// Helper function to get alert by ID
export const getAlertById = (id: string): Alert | undefined => {
  return mockAlerts.find(a => a.id === id);
};

// Get running containers count
export const getRunningContainersCount = (): number => {
  return mockContainers.filter(c => c.status === 'running').length;
};

// Get stopped containers count
export const getStoppedContainersCount = (): number => {
  return mockContainers.filter(c => c.status === 'exited').length;
};

// Get new alerts count
export const getNewAlertsCount = (): number => {
  return mockAlerts.filter(a => a.status === 'new').length;
};

// Get critical alerts count
export const getCriticalAlertsCount = (): number => {
  return mockAlerts.filter(a => a.severity === 'critical').length;
};
