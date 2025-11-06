import React, { useState, useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";
import { Loader, XCircle } from "lucide-react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Button } from "../../components/uiLibraries/button";
import { useContainersData } from "../../hooks/useContainersData";
import { type TransformedContainer } from "../../utils/dashboard";

import { ContainersSummary } from "./ContainersSummary";
import { ContainersFilter } from "./ContainersFilter";
import { ContainersTable } from "./ContainersTable";
import { ContainerDetailsDialog } from "./ContainerDetailsDialog";

export const ContainersPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContainer, setSelectedContainer] =
    useState<TransformedContainer | null>(null);

  const { containers, loading, error, refetch } = useContainersData(5000);

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
        <Card className="border-red-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-600">
                  Error loading containers
                </p>
                <p className="text-sm text-red-500">{error}</p>
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
      />
    </div>
  );
};
