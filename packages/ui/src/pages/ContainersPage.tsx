import React, { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import {
  Container,
  Search,
  Play,
  Square,
  RotateCw,
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
} from "../components/uiLibraries/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/uiLibraries/select";
import { Progress } from "../components/uiLibraries/progress";
import {
  mockContainers,
  type Container as ContainerType,
} from "../utils/mockData2";
import colors, { getColor } from "../assets/styles/color";
import { getStatusColor as utilGetStatusColor } from "../utils/utils";

export const ContainersPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContainer, setSelectedContainer] =
    useState<ContainerType | null>(null);

  const filteredContainers = mockContainers.filter((container) => {
    const matchesSearch =
      container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.image.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || container.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  const runningCount = mockContainers.filter(
    (c) => c.status === "running"
  ).length;
  const stoppedCount = mockContainers.filter(
    (c) => c.status === "exited"
  ).length;
  const pausedCount = mockContainers.filter(
    (c) => c.status === "paused"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Containers</h1>
        <p className="text-muted-foreground">
          Manage and monitor Docker containers
        </p>
      </div>

      {/* Summary cards */}
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

      {/* Filters and search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search containers by name, image, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" tokenStyles>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Containers table */}
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
                {filteredContainers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Container className="h-8 w-8 text-muted-foreground" />
                        <p className={"text-muted-foreground"}>
                          No containers found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContainers.map((container) => (
                    <TableRow
                      key={container.id}
                      className={"hover:bg-muted/50"}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(container.status)}
                          <div>
                            <p className={"text-foreground"}>
                              {container.name}
                            </p>
                            <p className={"text-sm text-muted-foreground"}>
                              {container.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={"text-muted-foreground"}>
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
                      <TableCell className={"text-muted-foreground"}>
                        {container.uptime}
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className={"text-foreground"}>
                              {container.cpu.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={container.cpu} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className={"text-foreground"}>
                              {container.memory.toFixed(1)} GB
                            </span>
                          </div>
                          <Progress
                            value={
                              (container.memory / container.memoryLimit) * 100
                            }
                            className="h-1.5"
                          />
                        </div>
                      </TableCell>
                      <TableCell className={"text-muted-foreground"}>
                        {container.lastEvent}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedContainer(container)}
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

      {/* Container details dialog */}
      <Dialog
        open={!!selectedContainer}
        onOpenChange={() => setSelectedContainer(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Container Details</DialogTitle>
            <DialogDescription>
              {selectedContainer?.name} ({selectedContainer?.id})
            </DialogDescription>
          </DialogHeader>
          {selectedContainer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Image</p>
                  <p className="text-foreground">{selectedContainer.image}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge
                    variant="outline"
                    style={getStatusBadgeStyle(selectedContainer.status)}
                  >
                    {selectedContainer.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                  <p className="text-foreground">{selectedContainer.uptime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="text-foreground">
                    {new Date(selectedContainer.created).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      CPU Usage
                    </span>
                    <span className="text-foreground">
                      {selectedContainer.cpu.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={selectedContainer.cpu} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Memory Usage
                    </span>
                    <span className="text-foreground">
                      {selectedContainer.memory.toFixed(1)} /{" "}
                      {selectedContainer.memoryLimit.toFixed(1)} GB
                    </span>
                  </div>
                  <Progress
                    value={
                      (selectedContainer.memory /
                        selectedContainer.memoryLimit) *
                      100
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Event</p>
                <p className="text-foreground">{selectedContainer.lastEvent}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedContainer.status !== "running"}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedContainer.status === "running"}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
