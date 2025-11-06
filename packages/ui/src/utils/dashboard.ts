// src/utils/dashboard.ts
import type {
  ApiResponse,
  DashboardData,
  SystemStatus,
} from "../types/dashboard";
import { apiFetch } from "./apiClient";

export async function getDashboardData(): Promise<ApiResponse<DashboardData>> {
  return apiFetch<ApiResponse<DashboardData>>("/dashboard");
}

// Optional granular calls if your backend supports them
export async function getDaemonStatus() {
  return apiFetch("/daemon-status");
}

/**
 * Fetch alerts from backend and transform to frontend format
 */
export async function getAlerts() {
  try {
    const rawAlerts = await apiFetch<any[]>("/alerts");
    return transformBackendAlerts(rawAlerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw error;
  }
}

/**
 * Fetch containers from backend and transform to frontend format
 */
export async function getContainers() {
  try {
    const rawContainers = await apiFetch<any[]>("/containers/list");
    return transformBackendContainers(rawContainers);
  } catch (error) {
    console.error("Error fetching containers:", error);
    throw error;
  }
}

/**
 * Fetch events from backend and transform to frontend format
 */
export async function getEvents(
  limit?: number,
  eventType?: string,
  container?: string
) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (eventType) params.append("type", eventType);
    if (container) params.append("container", container);

    const queryString = params.toString();
    const endpoint = queryString ? `/events?${queryString}` : "/events";
    const rawEvents = await apiFetch<any[]>(endpoint);
    return transformBackendEvents(rawEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export interface TransformedContainer {
  id: string;
  name: string;
  image: string;
  status: "running" | "exited" | "paused";
  uptime: string;
  cpu: number;
  memory: number;
  memory_limit: number;
  created: string;
  last_event: string;
  full_id: string;
}

/**
 * Transform backend container format to frontend format
 */
export function transformBackendContainers(
  rawContainers: any[]
): TransformedContainer[] {
  if (!Array.isArray(rawContainers)) return [];

  return rawContainers.map((container) => ({
    id: container.id || "unknown",
    name: container.name || "unnamed",
    image: container.image || "unknown",
    status: (container.status || "unknown") as "running" | "exited" | "paused",
    uptime: container.uptime || "N/A",
    cpu: Number(container.cpu) || 0,
    memory: Number(container.memory) || 0,
    memory_limit: Number(container.memory_limit) || 0,
    created: container.created || "",
    last_event: container.last_event || "unknown",
    full_id: container.full_id || container.id || "",
  }));
}

/**
 * Transform backend alert format to frontend format
 * Backend can return either Falco alerts or container inspection alerts
 */
export function transformBackendAlerts(
  backendAlerts: any[]
): TransformedAlert[] {
  return backendAlerts.map((alert) => {
    // Falco alert format
    if (alert.source === "falco") {
      return {
        id: alert.id || generateId(),
        timestamp: alert.timestamp || new Date().toISOString(),
        type: alert.rule || "Unknown Rule",
        severity: mapSeverity(alert.severity),
        container: alert.container?.name || "unknown",
        status: alert.status || "new",
        description: alert.summary || "No description available",
        details: formatFalcoDetails(alert),
        suggestedAction:
          alert.suggested_action || getDefaultSuggestedAction(alert.severity),
      };
    }

    // Container inspection alert format (from alerts.jsonl)
    if (alert.risks && alert.metadata) {
      const maxSeverityRisk = alert.risks.reduce((prev: any, current: any) =>
        getSeverityLevel(current.severity) > getSeverityLevel(prev.severity)
          ? current
          : prev
      );

      return {
        id: alert.id || generateId(),
        timestamp: alert.log_time || new Date().toISOString(),
        type: maxSeverityRisk.rule || "Container Risk Detected",
        severity: mapSeverity(maxSeverityRisk.severity),
        container: alert.metadata.id?.substring(0, 12) || "unknown",
        status: "new",
        description:
          maxSeverityRisk.description || "Container has detected risks",
        details: formatContainerRisks(alert.risks),
        suggestedAction: getDefaultSuggestedAction(maxSeverityRisk.severity),
      };
    }

    // Fallback for unknown format
    return {
      id: alert.id || generateId(),
      timestamp: alert.timestamp || alert.log_time || new Date().toISOString(),
      type: alert.type || "Alert",
      severity: "info",
      container: alert.container || "unknown",
      status: "new",
      description: alert.description || JSON.stringify(alert).substring(0, 100),
      details: "Unable to parse alert details",
      suggestedAction: "Review alert details for more information",
    };
  });
}

export interface TransformedAlert {
  id: string;
  timestamp: string;
  type: string;
  severity: "critical" | "warning" | "info";
  container: string;
  status: "new" | "acknowledged" | "resolved";
  description: string;
  details: string;
  suggestedAction?: string;
}

export interface TransformedEvent {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  container?: string;
  details?: string;
}

/**
 * Transform backend event format to frontend format
 */
export function transformBackendEvents(
  backendEvents: any[]
): TransformedEvent[] {
  if (!Array.isArray(backendEvents)) return [];

  return backendEvents.map((event) => ({
    id: event.id || generateId(),
    timestamp: event.timestamp || new Date().toISOString(),
    type: event.type || "Unknown Event",
    message: event.message || "No message provided",
    container: event.container || undefined,
    details: event.details || undefined,
  }));
}

/**
 * Map backend severity levels to frontend format
 */
function mapSeverity(severity: string): "critical" | "warning" | "info" {
  const sev = (severity || "").toLowerCase();
  if (sev === "critical" || sev === "high") return "critical";
  if (sev === "warning" || sev === "medium") return "warning";
  return "info";
}

/**
 * Get numeric severity level for comparison
 */
function getSeverityLevel(severity: string): number {
  const sev = (severity || "").toLowerCase();
  if (sev === "critical" || sev === "high") return 3;
  if (sev === "warning" || sev === "medium") return 2;
  return 1;
}

/**
 * Format Falco alert details
 */
function formatFalcoDetails(alert: any): string {
  const parts: string[] = [];

  if (alert.container?.name) {
    parts.push(`Container: ${alert.container.name}`);
  }
  if (alert.process) {
    parts.push(`Process: ${alert.process}`);
  }
  if (alert.user) {
    parts.push(`User: ${alert.user}`);
  }
  if (alert.container?.image) {
    parts.push(`Image: ${alert.container.image}`);
  }

  return parts.join("\n") || alert.raw?.output || "No additional details";
}

/**
 * Format container risks from alerts.jsonl
 */
function formatContainerRisks(risks: any[]): string {
  if (!risks || risks.length === 0) return "No risks detected";

  return risks.map((risk) => `• ${risk.rule}: ${risk.description}`).join("\n");
}

/**
 * Get default suggested action based on severity
 */
function getDefaultSuggestedAction(severity: string): string {
  const sev = (severity || "").toLowerCase();
  if (sev === "critical" || sev === "high") {
    return "Investigate immediately and take corrective action";
  }
  if (sev === "warning" || sev === "medium") {
    return "Review and monitor for further issues";
  }
  return "Log for audit and continue monitoring";
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<{
  status: string;
  alert_id: string;
}> {
  try {
    const response = await apiFetch<{
      status: string;
      alert_id: string;
    }>(`/alerts/${alertId}/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`Error acknowledging alert ${alertId}:`, error);
    throw error;
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<{
  status: string;
  alert_id: string;
}> {
  try {
    const response = await apiFetch<{
      status: string;
      alert_id: string;
    }>(`/alerts/${alertId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`Error resolving alert ${alertId}:`, error);
    throw error;
  }
}

/**
 * Stop a container
 */
export async function stopContainer(containerId: string): Promise<{
  status: string;
  id: string;
  name: string;
  image: string[];
  message: string;
}> {
  try {
    const response = await apiFetch<{
      status: string;
      id: string;
      name: string;
      image: string[];
      message: string;
    }>(`/containers/${containerId}/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`Error stopping container ${containerId}:`, error);
    throw error;
  }
}

/**
 * Start a container
 */
export async function startContainer(containerId: string): Promise<{
  status: string;
  id: string;
  name: string;
  image: string[];
  message: string;
}> {
  try {
    const response = await apiFetch<{
      status: string;
      id: string;
      name: string;
      image: string[];
      message: string;
    }>(`/containers/${containerId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`Error starting container ${containerId}:`, error);
    throw error;
  }
}

/**
 * Restart a container
 */
export async function restartContainer(containerId: string): Promise<{
  status: string;
  id: string;
  name: string;
  image: string[];
  message: string;
}> {
  try {
    const response = await apiFetch<{
      status: string;
      id: string;
      name: string;
      image: string[];
      message: string;
    }>(`/containers/${containerId}/restart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`Error restarting container ${containerId}:`, error);
    throw error;
  }
}

/**
 * Get image approval status
 */
export async function getImageApprovalStatus(imageKey: string): Promise<{
  approved: boolean;
}> {
  try {
    const response = await apiFetch<{
      approved: boolean;
    }>(`/approvals/${encodeURIComponent(imageKey)}`, {
      method: "GET",
    });
    return response;
  } catch (error) {
    console.error(`Error fetching approval status for ${imageKey}:`, error);
    throw error;
  }
}

/**
 * Approve an image
 */
export async function approveImage(imageKey: string): Promise<{
  status: string;
  approved: boolean;
}> {
  try {
    const response = await apiFetch<{
      status: string;
      approved: boolean;
    }>(`/approvals/${encodeURIComponent(imageKey)}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`Error approving image ${imageKey}:`, error);
    throw error;
  }
}

/**
 * Deny an image
 */
export async function denyImage(imageKey: string): Promise<{
  status: string;
  approved: boolean;
}> {
  try {
    const response = await apiFetch<{
      status: string;
      approved: boolean;
    }>(`/approvals/${encodeURIComponent(imageKey)}/deny`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(`Error denying image ${imageKey}:`, error);
    throw error;
  }
}

/**
 * Get system status including host information and system resources
 * Transforms backend snake_case response to frontend camelCase format
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await apiFetch<any>("/system-status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transform snake_case from backend to camelCase for frontend
    const transformed: SystemStatus = {
      hostInformation: {
        operatingSystem: response.host_information?.operating_system || "N/A",
        kernelRelease: response.host_information?.kernel_release || "N/A",
        architecture: response.host_information?.architecture || "N/A",
        dockerVersion: response.host_information?.docker_version || "N/A",
        apiVersion: response.host_information?.api_version || "N/A",
      },
      systemResources: {
        cpu: {
          cores: response.system_resources?.cpu?.cores || "N/A",
          usagePercent: response.system_resources?.cpu?.usage_percent || 0,
        },
        memory: {
          totalGb: response.system_resources?.memory?.total_gb || "N/A",
          usedGb: response.system_resources?.memory?.used_gb || "N/A",
          usagePercent: response.system_resources?.memory?.usage_percent || 0,
        },
        disk: {
          totalGb: response.system_resources?.disk?.total_gb || "N/A",
          usedGb: response.system_resources?.disk?.used_gb || "N/A",
          usagePercent: response.system_resources?.disk?.usage_percent || 0,
        },
      },
      timestamp: response.timestamp || new Date().toISOString(),
    };

    return transformed;
  } catch (error) {
    console.error("Error fetching system status:", error);
    throw error;
  }
}

/**
 * Get Docker daemon information including images, volumes, and networks
 */
export async function getDockerDaemonInfo(): Promise<{
  images: { total: number; sizeGb: number };
  volumes: { total: number };
  networks: { total: number; bridge: number; custom: number };
  timestamp: string;
}> {
  try {
    const response = await apiFetch<any>("/docker-daemon", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Transform snake_case from backend to camelCase for frontend
    return {
      images: {
        total: response.images?.total || 0,
        sizeGb: response.images?.size_gb || 0,
      },
      volumes: {
        total: response.volumes?.total || 0,
      },
      networks: {
        total: response.networks?.total || 0,
        bridge: response.networks?.bridge || 0,
        custom: response.networks?.custom || 0,
      },
      timestamp: response.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Docker daemon info:", error);
    throw error;
  }
}
