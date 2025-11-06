import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/uiLibraries/dialog";
import { Badge } from "../../components/uiLibraries/badge";
import { Button } from "../../components/uiLibraries/button";
import { Progress } from "../../components/uiLibraries/progress";
import { Play, Square, RotateCw } from "lucide-react";
import { type TransformedContainer } from "../../utils/dashboard";
import colors from "../../assets/styles/color";
import { getStatusColor as utilGetStatusColor } from "../../utils/utils";

interface ContainerDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  container: TransformedContainer | null;
  isDarkMode: boolean;
}

export const ContainerDetailsDialog: React.FC<ContainerDetailsDialogProps> = ({
  isOpen,
  onClose,
  container,
  isDarkMode,
}) => {
  const getStatusBadgeStyle = (status: string) => {
    const bg = utilGetStatusColor(status, isDarkMode ? "dark" : "light");
    const text = isDarkMode
      ? colors.text.dark.primary
      : colors.text.light.primary;
    const border = isDarkMode ? colors.border.dark : colors.border.light;

    return {
      backgroundColor: bg,
      color: text,
      borderColor: border,
      padding: "0.15rem 0.5rem",
    } as React.CSSProperties;
  };

  if (!container) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Container Details</DialogTitle>
          <DialogDescription>
            {container.name} ({container.id})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Image</p>
              <p className="text-foreground">{container.image}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge
                variant="outline"
                style={getStatusBadgeStyle(container.status)}
              >
                {container.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Uptime</p>
              <p className="text-foreground">{container.uptime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="text-foreground">
                {new Date(container.created).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">CPU Usage</span>
                <span className="text-foreground">
                  {container.cpu.toFixed(1)}%
                </span>
              </div>
              <Progress value={container.cpu} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Memory Usage
                </span>
                <span className="text-foreground">
                  {container.memory.toFixed(1)} /{" "}
                  {container.memory_limit.toFixed(1)} GB
                </span>
              </div>
              <Progress
                value={(container.memory / container.memory_limit) * 100}
              />
            </div>
          </div>

          {/* Last Event */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Last Event</p>
            <p className="text-foreground">{container.last_event}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={container.status !== "running"}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={container.status === "running"}
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button variant="outline" size="sm">
              <RotateCw className="h-4 w-4 mr-2" />
              Restart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
