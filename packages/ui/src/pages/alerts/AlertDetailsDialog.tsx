import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "../../components/uiLibraries/badge";
import { Button } from "../../components/uiLibraries/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/uiLibraries/dialog";
import colors, { getColor } from "../../assets/styles/color";
import { useTheme } from "../../hooks/useTheme";
import type { TransformedAlert } from "../../utils/dashboard";
import { truncateText } from "../../utils/truncateText";

interface AlertDetailsDialogProps {
  alert: TransformedAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcknowledge: () => Promise<void>;
  onResolve: () => Promise<void>;
  getSeverityStyle: (severity: string) => React.CSSProperties;
  getAlertStatusStyle: (status: string) => React.CSSProperties;
  isLoading?: boolean;
}

export const AlertDetailsDialog: React.FC<AlertDetailsDialogProps> = ({
  alert,
  open,
  onOpenChange,
  onAcknowledge,
  onResolve,
  getSeverityStyle,
  getAlertStatusStyle,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();

  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="wrap-break-word">{alert.type}</DialogTitle>
          <DialogDescription>Alert ID: {alert.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              style={{
                backgroundColor: getSeverityStyle(alert.severity)
                  .backgroundColor,
                color: getSeverityStyle(alert.severity).color,
                borderColor: getSeverityStyle(alert.severity).borderColor,
              }}
            >
              {alert.severity}
            </Badge>
            <Badge
              variant="outline"
              style={{ ...getAlertStatusStyle(alert.status) }}
            >
              {alert.status}
            </Badge>
            <Badge variant="outline">{alert.container}</Badge>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p
              className="text-foreground wrap-break-word overflow-wrap-anywhere whitespace-pre-wrap w-full"
              style={{
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                whiteSpace: "pre-wrap",
                maxWidth: "100%",
              }}
            >
              {truncateText(alert.description, 500)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground mb-1">Details</p>
            <p className="text-foreground wrap-break-word w-full overflow-wrap">
              {alert.details}
            </p>
          </div>

          {alert.suggestedAction && (
            <div
              style={{
                backgroundColor: isDarkMode
                  ? colors.neutral[100]
                  : colors.info[50],
                borderColor: isDarkMode
                  ? colors.neutral[700]
                  : colors.info[200],
              }}
              className="rounded-lg p-4"
            >
              <p className="text-sm text-muted-foreground mb-1">
                Suggested Action
              </p>
              <p
                className="text-sm text-foreground wrap-break-word w-full"
                style={{ color: getColor("neutral", 600) }}
              >
                {alert.suggestedAction}
              </p>
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
            <p className="text-foreground">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            {alert.status === "new" && (
              <Button
                variant="outline"
                onClick={onAcknowledge}
                disabled={isLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
            )}
            {alert.status !== "resolved" && (
              <Button onClick={onResolve} disabled={isLoading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
