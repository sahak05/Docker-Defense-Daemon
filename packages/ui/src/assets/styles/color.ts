// src/assets/styles/colors.ts
/**
 * Central color palette for the Docker Defense Daemon UI
 * Supports both light and dark mode
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Main primary
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Neutral/Gray Scale
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
  },

  // Success (for healthy containers, resolved alerts)
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Main success
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  // Warning (for medium severity alerts)
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // Main warning
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  // Error/Danger (for critical alerts, stopped containers)
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444", // Main error
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  // Info (for informational alerts)
  info: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // Main info
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
  },

  // Docker Brand Colors
  docker: {
    blue: "#2496ed",
    darkBlue: "#1d63ed",
    lightBlue: "#00d1ff",
  },

  // Backgrounds
  background: {
    light: {
      primary: "#ffffff",
      secondary: "#f9fafb",
      tertiary: "#f3f4f6",
    },
    dark: {
      primary: "#0a0a0a",
      secondary: "#171717",
      tertiary: "#262626",
    },
  },

  // Text Colors
  text: {
    light: {
      primary: "#171717",
      secondary: "#525252",
      tertiary: "#737373",
      disabled: "#a3a3a3",
    },
    dark: {
      primary: "#fafafa",
      secondary: "#d4d4d4",
      tertiary: "#a3a3a3",
      disabled: "#525252",
    },
  },

  // Border Colors
  border: {
    light: "#e5e5e5",
    dark: "#404040",
  },

  // Status Colors (for container states)
  status: {
    running: "#22c55e",
    stopped: "#ef4444",
    paused: "#f59e0b",
    restarting: "#3b82f6",
    exited: "#737373",
    dead: "#7f1d1d",
  },

  // Alert Severity Colors
  severity: {
    critical: "#dc2626",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#737373",
    info: "#0ea5e9",
  },
} as const;

// Helper type for accessing colors
export type ColorShade = keyof typeof colors.primary;
export type ColorCategory = keyof typeof colors;

// Theme-aware color getter
export const getColor = (
  category: keyof typeof colors,
  shade?: ColorShade | keyof typeof colors.status,
  isDark = false
): string => {
  const colorCategory = colors[category as keyof typeof colors];

  if (!shade) {
    // Handle special cases without shade
    if (category === "border") {
      return isDark ? colors.border.dark : colors.border.light;
    }
    return typeof colorCategory === "object" && "500" in colorCategory
      ? (colorCategory as any)["500"]
      : "#000000";
  }

  if (typeof colorCategory === "object" && shade in colorCategory) {
    return (colorCategory as any)[shade];
  }

  return "#000000";
};

export default colors;
