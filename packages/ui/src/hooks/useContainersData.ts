import { useState, useEffect, useCallback, useRef } from "react";
import { getContainers, type TransformedContainer } from "../utils/dashboard";

export const useContainersData = (autoRefreshMs?: number) => {
  const [containers, setContainers] = useState<TransformedContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const fetchContainers = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const data = await getContainers();
      if (isMountedRef.current) {
        setContainers(Array.isArray(data) ? data : []);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch containers"
        );
        setContainers([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchContainers();

    if (autoRefreshMs && autoRefreshMs > 0) {
      const interval = setInterval(fetchContainers, autoRefreshMs);
      return () => {
        clearInterval(interval);
        isMountedRef.current = false;
      };
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoRefreshMs, fetchContainers]);

  return { containers, loading, error, refetch: fetchContainers };
};
