"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { tone?: "coral" | "teal" | "gold" }
>(({ className, value, tone = "coral", ...props }, ref) => {
  const palette = {
    coral: "var(--color-clay)",
    teal: "var(--color-moss)",
    gold: "var(--color-honey)",
  }[tone];
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-[var(--color-linen-2)]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-transform duration-500 ease-out"
        style={{
          transform: `translateX(-${100 - (value ?? 0)}%)`,
          background: palette,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
