import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight backdrop-blur-md transition-all",
  {
    variants: {
      variant: {
        default: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_-4px_rgba(34,211,238,0.6)]",
        success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_14px_-4px_rgba(52,211,153,0.6)]",
        warning: "border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_14px_-4px_rgba(251,191,36,0.6)]",
        danger: "border-rose-400/30 bg-rose-400/10 text-rose-300 shadow-[0_0_14px_-4px_rgba(251,113,133,0.6)]",
        purple: "border-violet-400/30 bg-violet-400/10 text-violet-300 shadow-[0_0_14px_-4px_rgba(167,139,250,0.6)]",
        outline: "border-white/15 bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
export default Badge;
