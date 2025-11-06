import React from "react";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import colors, { getColor } from "../../assets/styles/color";
import type { TransformedAlert } from "../../utils/dashboard";

interface AlertsSummaryProps {
  alerts: TransformedAlert[];
}

export const AlertsSummary: React.FC<AlertsSummaryProps> = ({ alerts }) => {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const newCount = alerts.filter((a) => a.status === "new").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Critical</p>
              <p className="text-foreground">{criticalCount}</p>
            </div>
            <div
              style={{ backgroundColor: colors.error[50] }}
              className="h-10 w-10 rounded-lg flex items-center justify-center"
            >
              <XCircle
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
              <p className="text-sm text-muted-foreground mb-1">Warning</p>
              <p className="text-foreground">{warningCount}</p>
            </div>
            <div
              style={{ backgroundColor: colors.warning[50] }}
              className="h-10 w-10 rounded-lg flex items-center justify-center"
            >
              <AlertTriangle
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
              <p className="text-sm text-muted-foreground mb-1">New Alerts</p>
              <p className="text-foreground">{newCount}</p>
            </div>
            <div
              style={{ backgroundColor: colors.info[50] }}
              className="h-10 w-10 rounded-lg flex items-center justify-center"
            >
              <Clock
                className="h-5 w-5"
                style={{ color: getColor("neutral", 600) }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
