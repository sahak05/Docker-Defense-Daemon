import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Button } from "../../components/uiLibraries/button";
import type { TransformedAlert } from "../../utils/dashboard";
import { useAlertsData } from "../../hooks/useAlertsData";
import { acknowledgeAlert, resolveAlert } from "../../utils/dashboard";
import { toast } from "sonner";

/* Sub-components */
import { AlertsSummary } from "./AlertsSummary";
import { AlertsFilter } from "./AlertsFilter";
import { AlertsTable } from "./AlertsTable";
import { AlertDetailsDialog } from "./AlertDetailsDialog";

/* Theme helpers */
import colors from "../../assets/styles/color";
import { useTheme } from "../../hooks/useTheme";

export const AlertsCenter: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { alerts, loading, error, refetch } = useAlertsData(); // Fetch once on mount, no auto-refresh
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<TransformedAlert | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
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
  }, [alerts, searchTerm, severityFilter, statusFilter]);

  const getSeverityStyle = (severity: string) => {
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

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;

    setIsLoading(true);
    try {
      await acknowledgeAlert(selectedAlert.id);
      toast.success("Alert acknowledged successfully");
      setSelectedAlert(null);
      refetch(); // Refresh the alerts list
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
      toast.error("Failed to acknowledge alert");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;

    setIsLoading(true);
    try {
      await resolveAlert(selectedAlert.id);
      toast.success("Alert marked as resolved");
      setSelectedAlert(null);
      refetch(); // Refresh the alerts list
    } catch (error) {
      console.error("Failed to resolve alert:", error);
      toast.error("Failed to resolve alert");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Alerts Center</h1>
          <p className="text-muted-foreground">
            Review and manage security and anomaly alerts
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-text-error shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-error">
                  Error loading alerts
                </p>
                <p className="text-sm text-text-error">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <AlertsSummary alerts={alerts} />

      {/* Filters and search */}
      <AlertsFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        severityFilter={severityFilter}
        onSeverityChange={setSeverityFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Alerts table */}
      <AlertsTable
        alerts={filteredAlerts}
        onSelectAlert={setSelectedAlert}
        getSeverityStyle={getSeverityStyle}
        getAlertStatusStyle={getAlertStatusStyle}
        getStatusIcon={getStatusIcon}
      />

      {/* Alert details dialog */}
      <AlertDetailsDialog
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={() => setSelectedAlert(null)}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        getSeverityStyle={getSeverityStyle}
        getAlertStatusStyle={getAlertStatusStyle}
        isLoading={isLoading}
      />
    </div>
  );
};
