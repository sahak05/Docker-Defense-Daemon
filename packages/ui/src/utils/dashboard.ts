// src/utils/dashboard.ts
import type { ApiResponse, DashboardData } from "../types/dashboard";
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
