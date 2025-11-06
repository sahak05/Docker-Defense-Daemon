import React, { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "../../components/uiLibraries/card";
import { Button } from "../../components/uiLibraries/button";
import { toast } from "sonner";
import { useEventsData } from "../../hooks/useEventsData";
import { EventsFilter } from "./components/EventsFilter";
import { EventsLoadingSkeleton } from "./components/EventsLoadingSkeleton";
import { EventsTable } from "./components/EventsTable";
export const EventLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch events from backend with auto-refresh
  const { events, loading, error, refetch } = useEventsData(
    autoRefresh ? 5000 : undefined,
    typeFilter !== "all" ? typeFilter : undefined,
    undefined,
    100
  );

  // Get unique event types for filter dropdown
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(events.map((e) => e.type)));
  }, [events]);

  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.container &&
          event.container.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [events, searchTerm]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Event logs refreshed");
    } catch (err) {
      toast.error("Failed to refresh events");
    }
  };

  // Show skeleton loading on initial load
  if (loading && events.length === 0) {
    return <EventsLoadingSkeleton />;
  }

  // Show error if fetch failed
  if (error && events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-foreground mb-1">Event Logs</h1>
            <p className="text-muted-foreground">
              System and container event logs
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-destructive mb-4">
                Error loading events: {error}
              </p>
              <Button onClick={handleRefresh}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Filter component */}
      <EventsFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        uniqueTypes={uniqueTypes}
        onRefresh={handleRefresh}
        isLoading={loading}
      />

      {/* Events table component */}
      <EventsTable filteredEvents={filteredEvents} />

      {/* Stats footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {filteredEvents.length} of {events.length} events
        </p>
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};
