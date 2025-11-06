import { useState, useEffect, useCallback, useRef } from "react";
import { getEvents } from "../utils/dashboard";
import type { TransformedEvent } from "../utils/dashboard";
import { ensureUniqueIds } from "../utils/dataValidation";

/**
 * useEventsData hook
 *
 * Manages events data fetching with:
 * - Prevention of memory leaks via isMounted tracking
 * - Concurrent fetch guard
 * - Loading and error states
 * - Auto-refresh capability
 * - Support for filtering by type and container
 */

export const useEventsData = (
  autoRefreshMs?: number,
  eventType?: string,
  container?: string,
  limit?: number
) => {
  const [events, setEvents] = useState<TransformedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEvents = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      if (!isMountedRef.current) return;

      setLoading(true);

      const data = await getEvents(limit, eventType, container);

      if (!isMountedRef.current) return;

      // Ensure unique IDs for list items to prevent React key warnings
      const cleanedData = ensureUniqueIds(data || []);

      setEvents(cleanedData);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Events fetch failed:", message);
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, [limit, eventType, container]);

  // Fetch on mount
  useEffect(() => {
    isMountedRef.current = true;

    fetchEvents();

    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchEvents]);

  // Auto-refresh if specified
  useEffect(() => {
    if (autoRefreshMs && autoRefreshMs > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchEvents();
      }, autoRefreshMs);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefreshMs, fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
};
