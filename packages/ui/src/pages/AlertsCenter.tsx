import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Download,
} from "lucide-react";
import { Card, CardContent } from "../components/uiLibraries/card";
import { Input } from "../components/uiLibraries/input";
import { Button } from "../components/uiLibraries/button";
import { Badge } from "../components/uiLibraries/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/uiLibraries/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/uiLibraries/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/uiLibraries/select";
import { mockAlerts } from "../utils/mockData2";
import type { Alert } from "../utils/mockData2";
import { toast } from "sonner";

/* Theme helpers */
import colors, { getColor } from "../assets/styles/color";
import { useTheme } from "../hooks/useTheme";

export const AlertsCenter: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesSearch =
      alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.container.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityStyle = (severity: string) => {
    // Use centralized color tokens when possible, fallback to CSS classes
    switch (severity) {
      case "critical":
        return {
          backgroundColor: colors.error[100],
          color: colors.error[700],
          borderColor: colors.error[200],
        };
      case "warning":
        return {
          backgroundColor: colors.warning[100],
          color: colors.warning[700],
          borderColor: colors.warning[200],
        };
      case "info":
        return {
          backgroundColor: colors.info[100],
          color: colors.info[700],
          borderColor: colors.info[200],
        };
      default:
        return {
          backgroundColor: isDarkMode
            ? colors.neutral[800]
            : colors.neutral[100],
          color: isDarkMode ? colors.neutral[100] : colors.neutral[700],
          borderColor: isDarkMode ? colors.neutral[700] : colors.neutral[200],
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4" />;
      case "acknowledged":
        return <AlertTriangle className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  // Map alert status to a colored style: new -> red, acknowledged -> yellow, resolved -> green
  const getAlertStatusStyle = (status: string) => {
    switch (status) {
      case "new":
        return {
          backgroundColor: isDarkMode ? colors.error[700] : colors.error[100],
          color: isDarkMode ? colors.error[50] : colors.error[700],
          borderColor: isDarkMode ? colors.error[600] : colors.error[200],
        } as React.CSSProperties;
      case "acknowledged":
        return {
          backgroundColor: isDarkMode
            ? colors.warning[700]
            : colors.warning[100],
          color: isDarkMode ? colors.warning[50] : colors.warning[700],
          borderColor: isDarkMode ? colors.warning[600] : colors.warning[200],
        } as React.CSSProperties;
      case "resolved":
        return {
          backgroundColor: isDarkMode
            ? colors.success[700]
            : colors.success[100],
          color: isDarkMode ? colors.success[50] : colors.success[700],
          borderColor: isDarkMode ? colors.success[600] : colors.success[200],
        } as React.CSSProperties;
      default:
        return {
          backgroundColor: isDarkMode
            ? colors.neutral[800]
            : colors.neutral[100],
          color: isDarkMode ? colors.neutral[100] : colors.neutral[700],
          borderColor: isDarkMode ? colors.neutral[700] : colors.neutral[200],
        } as React.CSSProperties;
    }
  };

  const handleAcknowledge = () => {
    toast.success("Alert acknowledged");
    setSelectedAlert(null);
  };

  const handleResolve = () => {
    toast.success("Alert marked as resolved");
    setSelectedAlert(null);
  };

  const criticalCount = mockAlerts.filter(
    (a) => a.severity === "critical"
  ).length;
  const warningCount = mockAlerts.filter(
    (a) => a.severity === "warning"
  ).length;
  const newCount = mockAlerts.filter((a) => a.status === "new").length;

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Alerts Center</h1>
        <p className="text-muted-foreground">
          Review and manage security and anomaly alerts
        </p>
      </div>

      {/* Summary cards */}
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
                  className="h-5 w-5 "
                  style={{ color: getColor("neutral", 600) }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts by type, container, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" tokenStyles>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert Type</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No alerts found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="text-foreground">{alert.type}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {alert.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          tokenStyles
                        >
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
                      <TableCell className="text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
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

      {/* Alert details dialog */}
      <Dialog
        open={!!selectedAlert}
        onOpenChange={() => setSelectedAlert(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAlert?.type}</DialogTitle>
            <DialogDescription>Alert ID: {selectedAlert?.id}</DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: getSeverityStyle(selectedAlert.severity)
                      .backgroundColor,
                    color: getSeverityStyle(selectedAlert.severity).color,
                    borderColor: getSeverityStyle(selectedAlert.severity)
                      .borderColor,
                  }}
                >
                  {selectedAlert.severity}
                </Badge>
                <Badge
                  variant="outline"
                  style={{ ...getAlertStatusStyle(selectedAlert.status) }}
                >
                  {selectedAlert.status}
                </Badge>
                <Badge variant="outline">{selectedAlert.container}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-foreground">{selectedAlert.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Details</p>
                <p className="text-foreground">{selectedAlert.details}</p>
              </div>

              {selectedAlert.suggestedAction && (
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
                    className="text-sm text-foreground"
                    style={{ color: getColor("neutral", 600) }}
                  >
                    {selectedAlert.suggestedAction}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
                <p className="text-foreground">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2 w-full sm:w-auto">
              {selectedAlert?.status === "new" && (
                <Button variant="outline" onClick={() => handleAcknowledge()}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              )}
              {selectedAlert?.status !== "resolved" && (
                <Button onClick={() => handleResolve()}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
