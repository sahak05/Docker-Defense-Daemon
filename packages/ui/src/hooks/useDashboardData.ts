import { useState, useEffect, useCallback, useRef } from "react";
import type { DashboardData } from "../types/dashboard";
import { getDashboardData } from "../utils/dashboard";

/**
 * useDashboardData hook
 *
 * Manages dashboard data fetching with:
 * - Prevented memory leaks via isMounted tracking
 * - Concurrent fetch guard
 * - Loading and error states
 */

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      if (!isMountedRef.current) return;

      setLoading(true);

      const data = await getDashboardData();

      if (!isMountedRef.current) return;

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || "Failed to fetch dashboard data");
      }

      setDashboardData(data.data);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Dashboard fetch failed:", message);
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Fetch once on mount
    fetchDashboardData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboardData]);

  return { dashboardData, loading, error };
};
