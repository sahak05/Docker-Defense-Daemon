import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getSystemStatus,
  getDaemonStatus,
  restartDaemon,
  stopDaemon,
} from "../../utils/dashboard";
import type { SystemStatus as SystemStatusType } from "../../types/dashboard";
import { useTheme } from "../../hooks/useTheme";
import { Button } from "../../components/uiLibraries/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/uiLibraries/dialog";
import {
  SystemRefreshHeader,
  DaemonStatusCard,
  HostInfoCard,
  SystemResourcesCard,
  DockerDaemonCard,
} from "./components";

/**
 * SystemStatusPage Component
 * Main page component that fetches and displays system status
 */
export const SystemStatusPage: React.FC = () => {
  useTheme();

  const [systemData, setSystemData] = useState<SystemStatusType | null>(null);
  const [daemonInfo, setDaemonInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"restart" | "stop" | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Fetch system status data from backend
   */
  const fetchSystemStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [status, daemon] = await Promise.all([
        getSystemStatus(),
        getDaemonStatus().catch(() => null),
      ]);
      setSystemData(status);
      setDaemonInfo(daemon);
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
      const [status, daemon] = await Promise.all([
        getSystemStatus(),
        getDaemonStatus().catch(() => null),
      ]);
      setSystemData(status);
      setDaemonInfo(daemon);
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
   */
  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  /**
   * Format daemon info for display
   */
  const formatDaemonInfo = useCallback(() => {
    if (!daemonInfo) {
      return {
        status: "unavailable",
        uptime: "N/A",
        version: "N/A",
        pollingInterval: 5000,
        lastCheck: new Date().toISOString(),
      };
    }

    const uptime = daemonInfo.uptime || 0;
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m`;

    return {
      status: daemonInfo.docker_ok ? "running" : "error",
      uptime: uptimeStr,
      version: daemonInfo.version || "N/A",
      pollingInterval: 5000,
      lastCheck: daemonInfo.timestamp || new Date().toISOString(),
    };
  }, [daemonInfo]);

  /**
   * Show restart confirmation dialog
   */
  const handleRestartClick = useCallback(() => {
    setDialogAction("restart");
    setDialogOpen(true);
  }, []);

  /**
   * Show stop confirmation dialog
   */
  const handleStopClick = useCallback(() => {
    setDialogAction("stop");
    setDialogOpen(true);
  }, []);

  /**
   * Handle confirmed action
   */
  const handleConfirm = useCallback(async () => {
    if (!dialogAction) return;

    try {
      setIsProcessing(true);
      setDialogOpen(false);

      if (dialogAction === "restart") {
        await restartDaemon();
        toast.success(
          "Daemon restart initiated. The system will come back online shortly."
        );
        setTimeout(() => {
          fetchSystemStatus();
        }, 3000);
      } else if (dialogAction === "stop") {
        await stopDaemon();
        toast.success("Daemon stop initiated. The system is shutting down.");
        setTimeout(() => {
          fetchSystemStatus().catch(() => {
            toast.error(
              "System is offline. Please restart the daemon manually."
            );
          });
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to perform action";
      console.error(`Error during ${dialogAction}:`, err);
      toast.error(
        `${
          dialogAction === "restart" ? "Restart" : "Stop"
        } failed: ${errorMessage}`
      );
    } finally {
      setIsProcessing(false);
      setDialogAction(null);
    }
  }, [dialogAction, fetchSystemStatus]);

  /**
   * Handle dialog cancel
   */
  const handleCancel = useCallback(() => {
    setDialogOpen(false);
    setDialogAction(null);
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
          daemonInfo={formatDaemonInfo()}
          onRestart={handleRestartClick}
          onStop={handleStopClick}
        />

        {/* Host Information Card */}
        <HostInfoCard systemData={systemData} />
      </div>

      {/* System Resources Card */}
      <SystemResourcesCard systemData={systemData} />

      {/* Docker Daemon Card */}
      <DockerDaemonCard />

      {/* Daemon Action Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "restart" ? "Restart Daemon?" : "Stop Daemon?"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "restart"
                ? "This will restart the daemon process. The system monitoring will be temporarily unavailable during the restart, which typically takes a few seconds."
                : "This will stop the daemon process and halt all system monitoring. You will need to manually restart the daemon to resume monitoring."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={dialogAction === "stop" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Processing..."
                : dialogAction === "restart"
                ? "Restart"
                : "Stop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemStatusPage;
