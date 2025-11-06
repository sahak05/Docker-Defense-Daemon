import React from "react";
import { ScrollText } from "lucide-react";
import { Card, CardContent } from "../../../components/uiLibraries/card";
import { Badge } from "../../../components/uiLibraries/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/uiLibraries/table";
import { useTheme } from "../../../hooks/useTheme";
import colors, { getColor } from "../../../assets/styles/color";
import type { TransformedEvent } from "../../../utils/dashboard";

interface EventsTableProps {
  filteredEvents: TransformedEvent[];
}

const getTypeBadgeStyle = (type: string): React.CSSProperties => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  // Map common event types to severity categories
  const map: Record<string, string> = {
    "Alert Created": "warning",
    "Alert Acknowledged": "warning",
    "Alert Resolved": "success",
    "Container Started": "success",
    "Container Stopped": "error",
    "Container Restarted": "warning",
    "Container Created": "info",
    "Health Check": "success",
    "Daemon Event": "info",
    "Image Pulled": "info",
    "Metrics Collected": "info",
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
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

export const EventsTable: React.FC<EventsTableProps> = ({ filteredEvents }) => {
  const { isDarkMode } = useTheme();

  return (
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
              {filteredEvents.length === 0 ? (
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
                filteredEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={getTypeBadgeStyle(event.type)}
                      >
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.container ? (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            color: isDarkMode
                              ? getColor("neutral", 300)
                              : getColor("neutral", 700),
                          }}
                        >
                          {event.container}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {event.message}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.details || "—"}
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
