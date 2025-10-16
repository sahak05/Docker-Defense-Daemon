"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";
import { getColor, getBackgroundColor } from "../../assets/styles/color";
import { useTheme } from "../../hooks/useTheme";

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & {
  tokenStyles?: boolean;
};

function Switch({ className, tokenStyles = false, ...props }: SwitchProps) {
  const { isDarkMode } = useTheme();

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={
        tokenStyles
          ? { backgroundColor: getBackgroundColor("primary", isDarkMode) }
          : undefined
      }
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
        style={
          tokenStyles
            ? {
                backgroundColor: getBackgroundColor("primary", isDarkMode),
                borderColor: getColor("border", 200, isDarkMode),
              }
            : undefined
        }
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
