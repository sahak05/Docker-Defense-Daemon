import React from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Button } from "../../components/uiLibraries/button";
import { Badge } from "../../components/uiLibraries/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/uiLibraries/table";
import type { TransformedAlert } from "../../utils/dashboard";
import { truncateText } from "../../utils/truncateText";

interface AlertsTableProps {
  alerts: TransformedAlert[];
  onSelectAlert: (alert: TransformedAlert) => void;
  getSeverityStyle: (severity: string) => React.CSSProperties;
  getAlertStatusStyle: (status: string) => React.CSSProperties;
  getStatusIcon: (status: string) => React.ReactNode;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  onSelectAlert,
  getSeverityStyle,
  getAlertStatusStyle,
  getStatusIcon,
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ maxWidth: "200px" }}>Alert Type</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No alerts found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id} className="hover:bg-muted/50">
                    <TableCell style={{ maxWidth: "150px" }}>
                      <div className="truncate">
                        <p
                          className="text-foreground truncate font-medium"
                          title={alert.type}
                        >
                          {alert.type}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {truncateText(alert.description, 100)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs" tokenStyles>
                        {alert.container}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        tokenStyles
                        variant="outline"
                        style={{
                          backgroundColor: getSeverityStyle(alert.severity)
                            .backgroundColor,
                          color: getSeverityStyle(alert.severity).color,
                          borderColor: getSeverityStyle(alert.severity)
                            .borderColor,
                        }}
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(alert.status)}
                        <Badge
                          variant="outline"
                          style={{
                            ...getAlertStatusStyle(alert.status),
                            padding: "0.15rem 0.5rem",
                          }}
                        >
                          {alert.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(alert.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectAlert(alert)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
