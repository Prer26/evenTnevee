import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.05em] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--eventneve-raspberry-wine)]/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--eventneve-raspberry-wine)] text-[var(--primary-foreground)] shadow-sm",
        secondary:
          "border-transparent bg-[var(--eventneve-soft-rose)]/70 text-[var(--eventneve-charcoal)]",
        destructive:
          "border-transparent bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-sm",
        outline: "border-[var(--border)] bg-transparent text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
