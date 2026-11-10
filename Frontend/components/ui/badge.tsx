import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.06] text-white/80",
        outline: "border-white/15 text-white/60 hover:border-white/25",
        success: "border-emerald-500/30 bg-emerald-500/12 text-emerald-400 shadow-[0_0_12px_-4px_rgba(16,185,129,0.4)]",
        warning: "border-amber-500/30 bg-amber-500/12 text-amber-400 shadow-[0_0_12px_-4px_rgba(245,158,11,0.3)]",
        danger: "border-red-500/30 bg-red-500/12 text-red-400 shadow-[0_0_12px_-4px_rgba(239,68,68,0.3)]",
        cyan: "border-cyan-500/30 bg-cyan-500/12 text-cyan-300 shadow-[0_0_12px_-4px_rgba(6,182,212,0.35)]",
        purple: "border-violet-500/30 bg-violet-500/12 text-violet-300 shadow-[0_0_12px_-4px_rgba(139,92,246,0.35)]",
        silver: "border-white/20 bg-gradient-to-b from-white/15 to-white/5 text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({ className, variant, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            pulse && "pulse-dot"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
