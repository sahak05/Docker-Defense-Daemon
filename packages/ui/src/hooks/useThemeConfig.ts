import { useMemo } from "react";
import { useTheme } from "./useTheme";

/**
 * useThemeConfig hook
 *
 * Derives effective dark mode from:
 * - Explicit prop (takes precedence)
 * - useTheme hook fallback
 */

export const useThemeConfig = (propIsDarkMode?: boolean) => {
  const themeHook = useTheme();

  const effectiveDark = useMemo(
    () =>
      typeof propIsDarkMode === "boolean"
        ? propIsDarkMode
        : themeHook.isDarkMode,
    [propIsDarkMode, themeHook.isDarkMode]
  );

  return {
    isDarkMode: effectiveDark,
    toggleTheme: themeHook.toggle,
  };
};
