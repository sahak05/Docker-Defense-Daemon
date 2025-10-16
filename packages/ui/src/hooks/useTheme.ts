import { useEffect, useState, useCallback } from "react";
import { colors, getColor } from "../assets/styles/color";

const STORAGE_KEY = "ddd:isDarkMode";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) return raw === "1";
    } catch {
      // ignore — localStorage access may fail in some environments
    }
    // Default: prefer system or light
    try {
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isDarkMode ? "1" : "0");
    } catch {
      // ignore — DOM or style access may fail in some environments
    }

    try {
      const root = document.documentElement;
      if (isDarkMode) root.classList.add("dark");
      else root.classList.remove("dark");

      // Apply CSS variables derived from the canonical color tokens so existing
      // class-based token rules in index.css pick up the correct values.
      // We set a curated list of variables used across the stylesheet.
      const setVar = (name: string, value: string) =>
        root.style.setProperty(name, value);

      // Primary shades
      Object.entries(colors.primary).forEach(([shade, hex]) => {
        setVar(`--primary-${shade}`, hex as string);
      });
      // Expose a main primary variable
      setVar("--primary", getColor("primary", 500, isDarkMode));

      // Muted / neutral tokens
      setVar("--muted", getColor("neutral", 200, isDarkMode));
      setVar("--muted-foreground", getColor("neutral", 600, isDarkMode));

      // Background / foreground
      setVar(
        "--background",
        isDarkMode
          ? colors.background.dark.primary
          : colors.background.light.primary
      );
      setVar(
        "--foreground",
        isDarkMode ? colors.text.dark.primary : colors.text.light.primary
      );

      // Card / input / ring / border tokens
      setVar(
        "--card",
        isDarkMode
          ? colors.background.dark.secondary
          : colors.background.light.secondary
      );
      setVar(
        "--card-foreground",
        isDarkMode ? colors.text.dark.primary : colors.text.light.primary
      );
      setVar(
        "--input-background",
        isDarkMode
          ? colors.background.dark.tertiary
          : colors.background.light.tertiary
      );
      setVar("--border", isDarkMode ? colors.border.dark : colors.border.light);
      setVar("--ring", getColor("primary", 300, isDarkMode));

      // Status/severity tokens
      Object.entries(colors.status).forEach(([k, v]) =>
        setVar(`--status-${k}`, v)
      );
      Object.entries(colors.severity).forEach(([k, v]) =>
        setVar(`--severity-${k}`, v)
      );
    } catch {
      // ignore — errors setting CSS variables should not break runtime
    }
  }, [isDarkMode]);

  const toggle = useCallback(() => setIsDarkMode((v) => !v), []);

  return { isDarkMode, setIsDarkMode, toggle } as const;
}

export default useTheme;
