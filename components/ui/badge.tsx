import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        cream: "bg-[var(--color-linen-2)] text-[var(--color-ink)]",
        coral: "bg-[var(--color-clay-soft)] text-[var(--color-clay-deep)]",
        teal: "bg-[var(--color-moss-soft)] text-[#0a8a7d]",
        gold: "bg-[var(--color-honey-soft)] text-[#7a5300]",
        rose: "bg-[var(--color-rose-soft)] text-[#a23434]",
      },
    },
    defaultVariants: { tone: "cream" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
