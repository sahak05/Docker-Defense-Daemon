"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";
import { getColor } from "../../assets/styles/color";
import { useTheme } from "../../hooks/useTheme";

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  tokenStyles?: boolean;
};

export function Progress({
  className,
  value,
  tokenStyles = false,
  ...props
}: ProgressProps) {
  const { isDarkMode } = useTheme();

  // normalize value to 0-100
  const pct = Math.max(0, Math.min(100, Number(value ?? 0)));

  const trackColor = tokenStyles
    ? getColor("primary", 100, isDarkMode)
    : getColor("neutral", 200, isDarkMode);
  const fillColor = getColor("primary", 500, isDarkMode);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {/* muted track behind the fill so it is always visible */}
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full w-full"
        style={{ backgroundColor: trackColor }}
      />

      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="absolute left-0 top-0 h-full w-full transition-all"
        style={{
          transform: `translateX(-${100 - pct}%)`,
          backgroundColor: fillColor,
        }}
      />
    </ProgressPrimitive.Root>
  );
}
