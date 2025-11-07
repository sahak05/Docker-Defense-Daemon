import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../../../components/uiLibraries/button";

interface SystemRefreshHeaderProps {
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const headingClass = "text-foreground mb-1";
const subClass = "text-muted-foreground";

export const SystemRefreshHeader: React.FC<SystemRefreshHeaderProps> = ({
  isLoading,
  error,
  onRefresh,
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={headingClass}>System Status</h1>
          <p className={subClass}>Monitor daemon and host system health</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error loading system status</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  );
};
