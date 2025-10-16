import React, { useState } from "react";
import { ScrollText, Search, Download, RefreshCw } from "lucide-react";
import { Card, CardContent } from "./uiLibraries/card";
import { Input } from "./uiLibraries/input";
import { Button } from "./uiLibraries/button";
import { Badge } from "./uiLibraries/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./uiLibraries/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./uiLibraries/select";
import { mockEventLogs } from "../utils/mockData2";
import { toast } from "sonner";
import colors, { getColor } from "../assets/styles/color";
import { useTheme } from "../hooks/useTheme";

export const EventLogs: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const filteredLogs = mockEventLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.container &&
        log.container.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || log.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(mockEventLogs.map((log) => log.type)));

  const getTypeBadgeStyle = (type: string) => {
    /*
     * The following block uses a few casts to interoperate with the
     * shared color tokens. These are quick, targeted disables to avoid
     * the @typescript-eslint/no-explicit-any noise during the migration.
     */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    // Map common event types to severity categories
    const map: Record<string, string> = {
      "Alert Created": "warning",
      "Alert Acknowledged": "warning",
      "Alert Resolved": "success",
      "Container Started": "info",
      "Container Stopped": "error",
      "Container Restarted": "warning",
      "Health Check": "success",
      "Daemon Event": "info",
    };

    const key = map[type] || "neutral";
    const bg =
      key === "neutral" ? getColor("neutral", 100) : getColor(key as any, 50);
    const color =
      key === "neutral" ? getColor("neutral", 700) : getColor(key as any, 600);
    const border =
      key === "neutral" ? colors.border.light : getColor(key as any, 200);

    return {
      backgroundColor: bg,
      color,
      borderColor: border,
      padding: "0.15rem 0.5rem",
    } as React.CSSProperties;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  const handleExport = () => {
    toast.success("Event logs exported successfully");
  };

  const handleRefresh = () => {
    toast.success("Event logs refreshed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground mb-1">Event Logs</h1>
          <p className="text-muted-foreground">
            System and container event logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Auto Refresh On" : "Auto Refresh Off"}
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                // style={{ color: getColor("neutral", 400) }}
              />
              <Input
                placeholder="Search events by message, type, or container..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} tokenStyles>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} tokenStyles>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event logs table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <ScrollText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No event logs found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className={"hover:bg-muted/50"}>
                      <TableCell
                        className={"text-muted-foreground whitespace-nowrap"}
                      >
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={getTypeBadgeStyle(log.type)}
                        >
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.container ? (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              color: isDarkMode
                                ? getColor("neutral", 300)
                                : getColor("neutral", 700),
                            }}
                          >
                            {log.container}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={"text-foreground"}>
                        {log.message}
                      </TableCell>
                      <TableCell className={"text-sm text-muted-foreground"}>
                        {log.details || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {filteredLogs.length} of {mockEventLogs.length} events
        </p>
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};
