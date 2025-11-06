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
export async function getAlerts() {
  return apiFetch("/alerts");
}
export async function getContainers() {
  return apiFetch("/containers");
}
