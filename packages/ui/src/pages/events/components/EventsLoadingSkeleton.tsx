import React from "react";
import { Card, CardContent } from "../../../components/uiLibraries/card";

export const EventsLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-32 bg-muted rounded mb-2 animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </div>

      {/* Filter Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="w-full sm:w-48">
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-20 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {/* Table header skeleton */}
            <div className="grid grid-cols-5 gap-4 pb-3 border-b">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>

            {/* Table rows skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
};
