import React from "react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Badge } from "../../components/uiLibraries/badge";
import { Progress } from "../../components/uiLibraries/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/uiLibraries/table";
import { Button } from "../../components/uiLibraries/button";
import { Container, Eye } from "lucide-react";
import { type TransformedContainer } from "../../utils/dashboard";
import colors from "../../assets/styles/color";
import { getStatusColor as utilGetStatusColor } from "../../utils/utils";

interface ContainersTableProps {
  containers: TransformedContainer[];
  isDarkMode: boolean;
  onSelectContainer: (container: TransformedContainer) => void;
}

export const ContainersTable: React.FC<ContainersTableProps> = ({
  containers,
  isDarkMode,
  onSelectContainer,
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

  const getStatusIcon = (status: string) => {
    const color = utilGetStatusColor(status, isDarkMode ? "dark" : "light");
    return (
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Container</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Last Event</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Container className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No containers found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                containers.map((container) => (
                  <TableRow key={container.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(container.status)}
                        <div>
                          <p className="text-foreground">{container.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {container.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {container.image}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={getStatusBadgeStyle(container.status)}
                      >
                        {container.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {container.uptime}
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-foreground">
                            {container.cpu.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={container.cpu} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-foreground">
                            {container.memory.toFixed(1)} GB
                          </span>
                        </div>
                        <Progress
                          value={
                            (container.memory / container.memory_limit) * 100
                          }
                          className="h-1.5"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {container.last_event}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectContainer(container)}
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
