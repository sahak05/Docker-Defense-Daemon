import React from "react";
import { Card, CardContent } from "../../components/uiLibraries/card";

export const ContainersLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="w-full sm:w-40">
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="w-full sm:w-40">
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {/* Table header skeleton */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>

            {/* Table rows skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
