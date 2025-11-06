import { useState, useEffect, useCallback, useRef } from "react";
import { getAlerts } from "../utils/dashboard";
import type { TransformedAlert } from "../utils/dashboard";
import { ensureUniqueIds } from "../utils/dataValidation";

/**
 * useAlertsData hook
 *
 * Manages alerts data fetching with:
 * - Prevention of memory leaks via isMounted tracking
 * - Concurrent fetch guard
 * - Loading and error states
 * - Auto-refresh capability
 */

export const useAlertsData = (autoRefreshMs?: number) => {
  const [alerts, setAlerts] = useState<TransformedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      if (!isMountedRef.current) return;

      setLoading(true);

      const data = await getAlerts();

      if (!isMountedRef.current) return;

      // Ensure unique IDs for list items to prevent React key warnings
      const cleanedData = ensureUniqueIds(data || []);

      setAlerts(cleanedData);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Alerts fetch failed:", message);
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    isMountedRef.current = true;

    fetchAlerts();

    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAlerts]);

  // Auto-refresh if specified
  useEffect(() => {
    if (autoRefreshMs && autoRefreshMs > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchAlerts();
      }, autoRefreshMs);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefreshMs, fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
};
