import React from "react";
import {
  Activity,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  RefreshCw,
  StopCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/uiLibraries/card";
import { Button } from "../components/uiLibraries/button";
import { Progress } from "../components/uiLibraries/progress";
import { Badge } from "../components/uiLibraries/badge";
import { mockSystemHealth, mockDaemonInfo } from "../utils/mockData2";
import { toast } from "sonner";

/* Theme helpers */
import colors, { getColor } from "../assets/styles/color";
import { useTheme } from "../hooks/useTheme";

export const SystemStatus: React.FC = () => {
  useTheme();
  const handleRestartDaemon = () => {
    toast.success("Daemon restart initiated");
  };

  const handleStopDaemon = () => {
    toast.success("Daemon stopped");
  };

  const headingClass = "text-foreground mb-1";
  const subClass = "text-muted-foreground";
  const valueClass = "text-foreground";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={headingClass}>System Status</h1>
        <p className={subClass}>Monitor daemon and host system health</p>
      </div>

      {/* Daemon status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  backgroundColor: colors.success[50],
                  color: colors.success[700],
                  borderColor: colors.success[200],
                }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {mockDaemonInfo.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Uptime</span>
              <span className={valueClass}>{mockDaemonInfo.uptime}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Version</span>
              <span className={valueClass}>{mockDaemonInfo.version}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Polling Interval</span>
              <span className={valueClass}>
                {mockDaemonInfo.pollingInterval}ms
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Last Health Check</span>
              <span className={valueClass}>
                {new Date(mockDaemonInfo.lastCheck).toLocaleTimeString()}
              </span>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestartDaemon}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart Daemon
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopDaemon}
                className="flex-1"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Daemon
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Host Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={subClass}>Operating System</span>
              <span className={valueClass}>{mockDaemonInfo.hostOS}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Docker Version</span>
              <span className={valueClass}>{mockDaemonInfo.dockerVersion}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Architecture</span>
              <span className={valueClass}>x86_64</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Kernel Version</span>
              <span className={valueClass}>5.15.0-87-generic</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={subClass}>Total Containers</span>
              <span className={valueClass}>12</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            System Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU Usage */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: colors.primary[50] }}
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                >
                  <Cpu
                    className="h-5 w-5 text-foreground"
                    style={{ color: getColor("neutral", 600) }}
                  />
                </div>
                <div>
                  <p className={subClass}>CPU Usage</p>
                  <p className={valueClass}>{mockSystemHealth.cpuUsage}%</p>
                </div>
              </div>
              <Progress value={mockSystemHealth.cpuUsage} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>8 cores available</span>
                <span>
                  {((mockSystemHealth.cpuUsage / 100) * 8).toFixed(1)} cores
                  used
                </span>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: colors.neutral[50] }}
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                >
                  <MemoryStick
                    className="h-5 w-5 text-foreground"
                    style={{ color: getColor("neutral", 600) }}
                  />
                </div>
                <div>
                  <p className={subClass}>Memory Usage</p>
                  <p className={valueClass}>{mockSystemHealth.memoryUsage}%</p>
                </div>
              </div>
              <Progress value={mockSystemHealth.memoryUsage} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>16 GB total</span>
                <span>
                  {((mockSystemHealth.memoryUsage / 100) * 16).toFixed(1)} GB
                  used
                </span>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: colors.warning[50] }}
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                >
                  <HardDrive className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className={subClass}>Disk Usage</p>
                  <p className={valueClass}>{mockSystemHealth.diskUsage}%</p>
                </div>
              </div>
              <Progress value={mockSystemHealth.diskUsage} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>500 GB total</span>
                <span>
                  {((mockSystemHealth.diskUsage / 100) * 500).toFixed(1)} GB
                  used
                </span>
              </div>
            </div>

            {/* Network */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: colors.success[50] }}
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                >
                  <Network className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className={subClass}>Network I/O</p>
                  <p className={valueClass}>
                    {mockSystemHealth.networkIn} / {mockSystemHealth.networkOut}{" "}
                    MB/s
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>In</span>
                  <span className={valueClass}>
                    {mockSystemHealth.networkIn} MB/s
                  </span>
                </div>
                <Progress value={(mockSystemHealth.networkIn / 200) * 100} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Out</span>
                  <span className={valueClass}>
                    {mockSystemHealth.networkOut} MB/s
                  </span>
                </div>
                <Progress value={(mockSystemHealth.networkOut / 200) * 100} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Docker daemon info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Docker Daemon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className={subClass}>Images</p>
              <p className={valueClass}>24 total</p>
              <p className="text-sm text-muted-foreground">3.2 GB</p>
            </div>

            <div>
              <p className={subClass}>Volumes</p>
              <p className={valueClass}>18 total</p>
              <p className="text-sm text-muted-foreground">12.5 GB</p>
            </div>

            <div>
              <p className={subClass}>Networks</p>
              <p className={valueClass}>5 total</p>
              <p className="text-sm text-muted-foreground">
                3 bridge, 2 custom
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
