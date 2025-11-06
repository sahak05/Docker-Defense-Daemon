/**
 * Formatting utilities for dashboard display
 *
 * Pure functions with no side effects; easily testable
 */

/**
 * Format uptime seconds into human-readable string
 * @param seconds - Uptime in seconds
 * @returns Formatted string like "2d 3h", "5h 10m", or "30m"
 */
export const formatUptime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0m";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Format ISO timestamp into relative time string
 * @param timestamp - ISO timestamp string or undefined
 * @returns Formatted string like "2h ago", "Just now", "3d ago", etc.
 */
export const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return "Unknown time";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid time";

  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 0) return "Just now";
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/**
 * Calculate memory usage percentage
 * @param used - Memory used in MB
 * @param total - Total memory in MB
 * @returns Percentage as string (e.g., "45.3")
 */
export const calculateMemoryPercentage = (
  used: number,
  total: number
): string => {
  if (!used || !total || total === 0) return "0.0";
  return ((used / total) * 100).toFixed(1);
};
