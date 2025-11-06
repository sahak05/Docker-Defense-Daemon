import React from "react";
import { Cpu, MemoryStick, HardDrive, Network } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/uiLibraries/card";
import { Progress } from "../../../components/uiLibraries/progress";
import colors, { getColor } from "../../../assets/styles/color";
import type { SystemStatus } from "../../../types/dashboard";

interface SystemResourcesCardProps {
  systemData: SystemStatus | null;
  isLoading: boolean;
}

const subClass = "text-muted-foreground";
const valueClass = "text-foreground";

const ResourceItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  percentage: number | string;
  details: string;
  bgColor: string;
}> = ({ icon, label, value, percentage, details, bgColor }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div
        style={{ backgroundColor: bgColor }}
        className="h-10 w-10 rounded-lg flex items-center justify-center"
      >
        {icon}
      </div>
      <div>
        <p className={subClass}>{label}</p>
        <p className={valueClass}>{value}</p>
      </div>
    </div>
    <Progress value={typeof percentage === "number" ? percentage : 0} />
    <p className="text-sm text-muted-foreground">{details}</p>
  </div>
);

export const SystemResourcesCard: React.FC<SystemResourcesCardProps> = ({
  systemData,
  isLoading,
}) => {
  const getCpuPercentageValue = (): number | string => {
    const val = systemData?.systemResources.cpu.usagePercent;
    return typeof val === "number" ? val : val || "N/A";
  };

  const getMemPercentageValue = (): number | string => {
    const val = systemData?.systemResources.memory.usagePercent;
    return typeof val === "number" ? val : val || "N/A";
  };

  const getDiskPercentageValue = (): number | string => {
    const val = systemData?.systemResources.disk.usagePercent;
    return typeof val === "number" ? val : val || "N/A";
  };

  const cpuPercent = getCpuPercentageValue();
  const memPercent = getMemPercentageValue();
  const diskPercent = getDiskPercentageValue();

  return (
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
          <ResourceItem
            icon={
              <Cpu
                className="h-5 w-5"
                style={{ color: getColor("neutral", 600) }}
              />
            }
            label="CPU Usage"
            value={
              typeof cpuPercent === "number" ? `${cpuPercent}%` : cpuPercent
            }
            percentage={typeof cpuPercent === "number" ? cpuPercent : 0}
            details={`${
              systemData?.systemResources.cpu.cores || "N/A"
            } cores available`}
            bgColor={colors.primary[50]}
          />

          {/* Memory Usage */}
          <ResourceItem
            icon={
              <MemoryStick
                className="h-5 w-5"
                style={{ color: getColor("neutral", 600) }}
              />
            }
            label="Memory Usage"
            value={
              typeof memPercent === "number" ? `${memPercent}%` : memPercent
            }
            percentage={typeof memPercent === "number" ? memPercent : 0}
            details={`${systemData?.systemResources.memory.usedGb} GB / ${systemData?.systemResources.memory.totalGb} GB`}
            bgColor={colors.neutral[50]}
          />

          {/* Disk Usage */}
          <ResourceItem
            icon={<HardDrive className="h-5 w-5 text-amber-600" />}
            label="Disk Usage"
            value={
              typeof diskPercent === "number" ? `${diskPercent}%` : diskPercent
            }
            percentage={typeof diskPercent === "number" ? diskPercent : 0}
            details={`${systemData?.systemResources.disk.usedGb} GB / ${systemData?.systemResources.disk.totalGb} GB`}
            bgColor={colors.warning[50]}
          />

          {/* Last Updated */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: colors.success[50] }}
                className="h-10 w-10 rounded-lg flex items-center justify-center"
              >
                <Network className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className={subClass}>Last Updated</p>
                <p className={valueClass}>
                  {systemData?.timestamp
                    ? new Date(systemData.timestamp).toLocaleTimeString()
                    : "Loading..."}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Click refresh button above for latest data
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
