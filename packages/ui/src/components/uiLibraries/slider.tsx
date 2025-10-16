"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";
import { getColor, getBackgroundColor } from "../../assets/styles/color";
import { useTheme } from "../../hooks/useTheme";

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  tokenStyles?: boolean;
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  tokenStyles = false,
  ...props
}: SliderProps) {
  const { isDarkMode } = useTheme();

  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max],
    [value, defaultValue, min, max]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
          tokenStyles ? "" : "bg-muted"
        )}
        style={
          tokenStyles
            ? { backgroundColor: getColor("neutral", 200, isDarkMode) }
            : undefined
        }
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
            tokenStyles ? "" : "bg-primary"
          )}
          style={
            tokenStyles
              ? { backgroundColor: getColor("primary", 500, isDarkMode) }
              : undefined
          }
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-4 shrink-0 rounded-full shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          style={
            tokenStyles
              ? {
                  backgroundColor: getBackgroundColor("primary", isDarkMode),
                  borderColor: getColor("border", 200, isDarkMode),
                }
              : undefined
          }
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
