"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
} | null>(null);

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const value = controlledValue ?? internal;
  const setValue = React.useCallback(
    (v: string) => {
      setInternal(v);
      onValueChange?.(v);
    },
    [onValueChange]
  );
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap gap-1 rounded-2xl",
        "border border-border/70 bg-background/75 p-1.5",
        "backdrop-blur-md shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <motion.button
      type="button"
      onClick={() => ctx.setValue(value)}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
        active
          ? [
              "bg-gradient-to-b from-background to-accent/40 text-foreground",
              "shadow-[0_1px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]",
              "border border-border/70",
            ].join(" ")
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className
      )}
    >
      {children}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/15"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
    </motion.button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      className={cn("flex-1", className)}
    >
      {children}
    </motion.div>
  );
}
