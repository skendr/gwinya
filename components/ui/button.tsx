import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-[transform,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-white bg-[var(--color-clay)] shadow-[0_4px_0_0_var(--color-clay-deep)] hover:brightness-[1.03] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-clay-deep)]",
        teal:
          "text-white bg-[var(--color-moss)] shadow-[0_4px_0_0_#0a8a7d] hover:brightness-[1.03] active:translate-y-[3px] active:shadow-[0_1px_0_0_#0a8a7d]",
        outline:
          "bg-[var(--color-paper)] text-[var(--color-ink)] shadow-[0_4px_0_0_rgba(28,36,51,0.12)] hover:bg-[var(--color-linen-2)] active:translate-y-[3px] active:shadow-[0_1px_0_0_rgba(28,36,51,0.12)]",
        ghost:
          "text-[var(--color-ink)] hover:bg-[var(--color-linen-2)]",
        link: "text-[var(--color-clay-deep)] underline-offset-4 hover:underline",
        destructive:
          "text-white bg-[var(--color-rose)] shadow-[0_4px_0_0_#c14d4d] hover:brightness-[1.03] active:translate-y-[3px] active:shadow-[0_1px_0_0_#c14d4d]",
      },
      size: {
        default: "h-13 min-h-[3.25rem] px-6",
        sm: "h-10 px-4 text-sm rounded-xl",
        lg: "h-14 min-h-[3.5rem] px-7 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
