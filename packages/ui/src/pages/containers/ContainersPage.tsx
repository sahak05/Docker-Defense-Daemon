import React, { useState, useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";
import { Loader, XCircle } from "lucide-react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Button } from "../../components/uiLibraries/button";
import { useContainersData } from "../../hooks/useContainersData";
import { type TransformedContainer } from "../../utils/dashboard";
import {
  stopContainer,
  startContainer,
  restartContainer,
} from "../../utils/dashboard";
import { toast } from "sonner";

import { ContainersSummary } from "./ContainersSummary";
import { ContainersFilter } from "./ContainersFilter";
import { ContainersTable } from "./ContainersTable";
import { ContainerDetailsDialog } from "./ContainerDetailsDialog";
import { ContainersLoadingSkeleton } from "./ContainersLoadingSkeleton";

export const ContainersPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContainer, setSelectedContainer] =
    useState<TransformedContainer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { containers, loading, error, refetch } = useContainersData(); // Fetch once on mount, no auto-refresh

  const handleStopContainer = async () => {
    if (!selectedContainer) return;

    setIsLoading(true);
    try {
      await stopContainer(selectedContainer.id);
      toast.success(`Container ${selectedContainer.name} stopped successfully`);
      setSelectedContainer(null);
      refetch();
    } catch (error) {
      console.error("Failed to stop container:", error);
      toast.error("Failed to stop container");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartContainer = async () => {
    if (!selectedContainer) return;

    setIsLoading(true);
    try {
      await startContainer(selectedContainer.id);
      toast.success(`Container ${selectedContainer.name} started successfully`);
      setSelectedContainer(null);
      refetch();
    } catch (error) {
      console.error("Failed to start container:", error);
      toast.error("Failed to start container");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartContainer = async () => {
    if (!selectedContainer) return;

    setIsLoading(true);
    try {
      await restartContainer(selectedContainer.id);
      toast.success(
        `Container ${selectedContainer.name} restarted successfully`
      );
      setSelectedContainer(null);
      refetch();
    } catch (error) {
      console.error("Failed to restart container:", error);
      toast.error("Failed to restart container");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and memoize to prevent unnecessary re-renders
  const filteredContainers = useMemo(() => {
    return containers.filter((container) => {
      const matchesSearch =
        container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        container.image.toLowerCase().includes(searchTerm.toLowerCase()) ||
        container.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || container.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [containers, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Containers</h1>
          <p className="text-muted-foreground">
            Manage and monitor Docker containers
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-error">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-text-error shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-error">
                  Error loading containers
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

      {/* Loading State */}
      {loading && containers.length === 0 ? (
        <ContainersLoadingSkeleton />
      ) : (
        <>
          {/* Summary Cards */}
          <ContainersSummary containers={containers} />

          {/* Filters */}
          <ContainersFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {/* Table */}
          <ContainersTable
            containers={filteredContainers}
            isDarkMode={isDarkMode}
            onSelectContainer={setSelectedContainer}
          />

          {/* Details Dialog */}
          <ContainerDetailsDialog
            isOpen={!!selectedContainer}
            onClose={() => setSelectedContainer(null)}
            container={selectedContainer}
            isDarkMode={isDarkMode}
            onStop={handleStopContainer}
            onStart={handleStartContainer}
            onRestart={handleRestartContainer}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};
