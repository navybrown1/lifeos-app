"use client";
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center overflow-hidden",
    "rounded-xl text-sm font-semibold tracking-tight gap-1.5",
    "transition-all duration-200 select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_2px_10px_hsl(var(--primary)/0.4)]",
          "hover:shadow-[0_4px_22px_hsl(var(--primary)/0.5)] hover:brightness-110",
          "active:brightness-95",
        ].join(" "),
        secondary: [
          "bg-muted/80 text-foreground border border-border/60",
          "hover:bg-muted hover:border-border hover:shadow-sm",
        ].join(" "),
        outline: [
          "border border-border/80 bg-background/80 text-foreground",
          "hover:bg-accent hover:border-primary/30",
          "backdrop-blur-sm",
        ].join(" "),
        ghost: [
          "text-foreground/80",
          "hover:bg-accent/60 hover:text-foreground",
        ].join(" "),
        destructive: [
          "bg-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.35)]",
          "hover:shadow-[0_4px_20px_rgba(239,68,68,0.5)] hover:brightness-110",
        ].join(" "),
        glow: [
          "bg-gradient-to-r from-violet-500 to-indigo-500 text-white",
          "shadow-[0_2px_18px_hsl(var(--primary)/0.5)]",
          "hover:shadow-[0_4px_36px_hsl(var(--primary)/0.7)] hover:scale-[1.02]",
        ].join(" "),
        warm: [
          "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
          "shadow-[0_2px_12px_rgba(251,146,60,0.4)]",
          "hover:shadow-[0_4px_24px_rgba(251,146,60,0.6)] hover:brightness-105",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-xs rounded-lg",
        lg: "h-11 px-6 py-3 text-base rounded-2xl",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const r = Math.max(rect.width, rect.height) * 1.2;
      const x = e.clientX - rect.left - r / 2;
      const y = e.clientY - rect.top - r / 2;
      const span = document.createElement("span");
      span.style.cssText = [
        "position:absolute;border-radius:50%;background:currentColor;",
        "opacity:0.15;width:" + (r * 2) + "px;height:" + (r * 2) + "px;",
        "left:" + x + "px;top:" + y + "px;pointer-events:none;",
        "transform:scale(0);animation:ripple 0.55s ease-out forwards;",
      ].join("");
      btn.appendChild(span);
      setTimeout(() => span.remove(), 600);
      onClick?.(e);
    };

    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as any}
        onClick={handleClick}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
