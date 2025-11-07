import React from "react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Play, Square, RotateCw } from "lucide-react";
import { type TransformedContainer } from "../../utils/dashboard";
import { getColor } from "../../assets/styles/color";

interface ContainersSummaryProps {
  containers: TransformedContainer[];
}

export const ContainersSummary: React.FC<ContainersSummaryProps> = ({
  containers,
}) => {
  const runningCount = containers.filter((c) => c.status === "running").length;
  const stoppedCount = containers.filter((c) => c.status === "exited").length;
  const pausedCount = containers.filter((c) => c.status === "paused").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Running</p>
              <p className="text-foreground">{runningCount}</p>
            </div>
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: getColor("success", 50) }}
            >
              <Play
                className="h-5 w-5"
                style={{ color: getColor("success", 600) }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stopped</p>
              <p className="text-foreground">{stoppedCount}</p>
            </div>
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: getColor("neutral", 50) }}
            >
              <Square
                className="h-5 w-5"
                style={{ color: getColor("neutral", 600) }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Paused</p>
              <p className="text-foreground">{pausedCount}</p>
            </div>
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: getColor("warning", 50) }}
            >
              <RotateCw
                className="h-5 w-5"
                style={{ color: getColor("warning", 600) }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
