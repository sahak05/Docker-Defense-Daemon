import React from "react";
import {
  Activity,
  RefreshCw,
  StopCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/uiLibraries/card";
import { Button } from "../../../components/uiLibraries/button";
import { Badge } from "../../../components/uiLibraries/badge";
import colors from "../../../assets/styles/color";

interface DaemonStatusCardProps {
  daemonInfo: {
    status: string;
    uptime: string;
    version: string;
    pollingInterval: number;
    lastCheck: string;
  };
  onRestart: () => void;
  onStop: () => void;
}

const subClass = "text-muted-foreground";
const valueClass = "text-foreground";

export const DaemonStatusCard: React.FC<DaemonStatusCardProps> = ({
  daemonInfo,
  onRestart,
  onStop,
}) => {
  // Determine status color and icon based on daemon status
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
        return {
          backgroundColor: colors.success[50],
          color: colors.success[700],
          borderColor: colors.success[200],
          icon: CheckCircle2,
        };
      case "error":
        return {
          backgroundColor: colors.error[50],
          color: colors.error[700],
          borderColor: colors.error[200],
          icon: XCircle,
        };
      case "unavailable":
        return {
          backgroundColor: colors.neutral[50],
          color: colors.neutral[700],
          borderColor: colors.neutral[200],
          icon: AlertCircle,
        };
      default:
        return {
          backgroundColor: colors.neutral[50],
          color: colors.neutral[700],
          borderColor: colors.neutral[200],
          icon: AlertCircle,
        };
    }
  };

  const statusConfig = getStatusConfig(daemonInfo.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Daemon Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={subClass}>Status</span>
          <Badge
            variant="outline"
            style={{
              backgroundColor: statusConfig.backgroundColor,
              color: statusConfig.color,
              borderColor: statusConfig.borderColor,
            }}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {daemonInfo.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>Uptime</span>
          <span className={valueClass}>{daemonInfo.uptime}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>Version</span>
          <span className={valueClass}>{daemonInfo.version}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>Polling Interval</span>
          <span className={valueClass}>{daemonInfo.pollingInterval}ms</span>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>Last Health Check</span>
          <span className={valueClass}>
            {new Date(daemonInfo.lastCheck).toLocaleTimeString()}
          </span>
        </div>

        <div className="pt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Daemon
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            className="flex-1"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Stop Daemon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
