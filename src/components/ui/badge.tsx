import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-primary text-primary-foreground",
          "shadow-[0_1px_6px_hsl(var(--primary)/0.4)]",
        ].join(" "),
        secondary: "border-transparent bg-muted/80 text-muted-foreground",
        outline: "border-border/80 text-foreground bg-background/60 backdrop-blur-sm",
        success: [
          "border-transparent bg-emerald-500/20 text-emerald-700",
          "dark:bg-emerald-500/15 dark:text-emerald-400",
        ].join(" "),
        warning: [
          "border-transparent bg-amber-500/20 text-amber-700",
          "dark:bg-amber-500/15 dark:text-amber-400",
        ].join(" "),
        danger: [
          "border-transparent bg-red-500/20 text-red-700",
          "dark:bg-red-500/15 dark:text-red-400",
        ].join(" "),
        glow: [
          "border-primary/30 bg-primary/10 text-primary",
          "shadow-[0_0_10px_hsl(var(--primary)/0.25)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
