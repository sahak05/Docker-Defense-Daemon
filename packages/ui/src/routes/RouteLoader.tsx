import React from "react";
import { Loader } from "lucide-react";

/**
 * RouteLoader
 *
 * Loading component displayed while lazy-loaded routes are being fetched and compiled
 * Shows a spinner with "Loading..." text
 */
export const RouteLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-12 h-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
};

export default RouteLoader;
