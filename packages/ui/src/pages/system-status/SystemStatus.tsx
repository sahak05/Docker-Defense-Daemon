import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getSystemStatus } from "../../utils/dashboard";
import type { SystemStatus as SystemStatusType } from "../../types/dashboard";
import { useTheme } from "../../hooks/useTheme";
import {
  SystemRefreshHeader,
  DaemonStatusCard,
  HostInfoCard,
  SystemResourcesCard,
  DockerDaemonCard,
} from "./components";

// Mock data for daemon info (could be fetched from backend in future)
const mockDaemonInfo = {
  status: "running",
  uptime: "5d 12h 34m",
  version: "1.0.0",
  pollingInterval: 5000,
  lastCheck: new Date().toISOString(),
};

/**
 * SystemStatusPage Component
 * Main page component that fetches and displays system status
 * Renamed from SystemStatus to avoid naming conflict with type
 */
export const SystemStatusPage: React.FC = () => {
  useTheme();

  const [systemData, setSystemData] = useState<SystemStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch system status data from backend
   */
  const fetchSystemStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSystemStatus();
      setSystemData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch system status";
      setError(errorMessage);
      console.error("Error fetching system status:", err);
      toast.error("Failed to load system status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSystemStatus();
      setSystemData(data);
      toast.success("System status refreshed");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh";
      console.error("Error refreshing system status:", err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch initial data on component mount
   * No auto-refresh - user has explicit control via refresh button
   */
  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  /**
   * Handle daemon restart (placeholder)
   */
  const handleRestartDaemon = useCallback(() => {
    toast.success("Daemon restart initiated");
  }, []);

  /**
   * Handle daemon stop (placeholder)
   */
  const handleStopDaemon = useCallback(() => {
    toast.success("Daemon stopped");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with refresh button and error display */}
      <SystemRefreshHeader
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daemon Status Card */}
        <DaemonStatusCard
          daemonInfo={mockDaemonInfo}
          onRestart={handleRestartDaemon}
          onStop={handleStopDaemon}
        />

        {/* Host Information Card */}
        <HostInfoCard systemData={systemData} isLoading={isLoading} />
      </div>

      {/* System Resources Card */}
      <SystemResourcesCard systemData={systemData} isLoading={isLoading} />

      {/* Docker Daemon Card */}
      <DockerDaemonCard />
    </div>
  );
};

export default SystemStatusPage;
