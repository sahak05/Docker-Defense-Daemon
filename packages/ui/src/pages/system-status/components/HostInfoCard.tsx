import React from "react";
import { Server } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/uiLibraries/card";
import type { SystemStatus } from "../../../types/dashboard";

interface HostInfoCardProps {
  systemData: SystemStatus | null;
}

const subClass = "text-muted-foreground";
const valueClass = "text-foreground";

export const HostInfoCard: React.FC<HostInfoCardProps> = ({ systemData }) => {
  return (
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
          <span className={valueClass}>
            {systemData?.hostInformation.operatingSystem || "Loading..."}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>Docker Version</span>
          <span className={valueClass}>
            {systemData?.hostInformation.dockerVersion || "Loading..."}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>Architecture</span>
          <span className={valueClass}>
            {systemData?.hostInformation.architecture || "Loading..."}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>Kernel Version</span>
          <span className={valueClass}>
            {systemData?.hostInformation.kernelRelease || "Loading..."}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className={subClass}>API Version</span>
          <span className={valueClass}>
            {systemData?.hostInformation.apiVersion || "Loading..."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
