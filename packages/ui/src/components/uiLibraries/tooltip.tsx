"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "./utils";
import {
  getColor,
  getBackgroundColor,
  getTextColor,
} from "../../assets/styles/color";
import { useTheme } from "../../hooks/useTheme";

type TooltipContentProps = React.ComponentProps<
  typeof TooltipPrimitive.Content
> & {
  tokenStyles?: boolean;
};

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  tokenStyles = false,
  ...props
}: TooltipContentProps) {
  const { isDarkMode } = useTheme();

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        style={
          tokenStyles
            ? {
                backgroundColor:
                  getBackgroundColor("primary", isDarkMode) ||
                  getColor("primary", 500, isDarkMode),
                color:
                  getTextColor("primary", isDarkMode) ||
                  getColor("primary", 50, isDarkMode),
              }
            : undefined
        }
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"
          style={
            tokenStyles
              ? {
                  backgroundColor:
                    getBackgroundColor("primary", isDarkMode) ||
                    getColor("primary", 500, isDarkMode),
                  fill:
                    getBackgroundColor("primary", isDarkMode) ||
                    getColor("primary", 500, isDarkMode),
                }
              : undefined
          }
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
