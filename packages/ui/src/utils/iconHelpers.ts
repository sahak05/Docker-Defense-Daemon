import React from "react";
import { CheckCircle2, XCircle, PauseCircle, Activity } from "lucide-react";
import { getStatusColor, getColor } from "../assets/styles/color";

/**
 * Icon helper utilities for status and container display
 *
 * Creates consistent icon elements based on status
 */

/**
 * Map of container status to React icon elements
 * @param isDarkMode - Whether dark mode is enabled
 * @returns Record mapping status strings to icon elements
 */
export const createStatusIconMap = (
  isDarkMode: boolean
): Record<string, React.ReactElement> => {
  return {
    running: React.createElement(CheckCircle2, {
      size: 20,
      color: getStatusColor("running", isDarkMode),
    }),
    stopped: React.createElement(XCircle, {
      size: 20,
      color: getStatusColor("stopped", isDarkMode),
    }),
    paused: React.createElement(PauseCircle, {
      size: 20,
      color: getStatusColor("paused", isDarkMode),
    }),
  };
};

/**
 * Get status icon element, with fallback to generic activity icon
 * @param status - Container status string
 * @param statusIcons - Pre-created icon map
 * @param isDarkMode - Whether dark mode is enabled
 * @returns React icon element
 */
export const getStatusIcon = (
  status: string,
  statusIcons: Record<string, React.ReactElement>,
  isDarkMode: boolean
): React.ReactElement => {
  return (
    statusIcons[status] ||
    React.createElement(Activity, {
      size: 20,
      color: getColor("neutral", "500", isDarkMode),
    })
  );
};

/**
 * Severity order for risk comparison
 */
export const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Get numeric severity score
 * @param severity - Severity string
 * @returns Numeric score (0-4)
 */
export const getSeverityScore = (severity: string): number => {
  return SEVERITY_ORDER[severity] ?? 0;
};
