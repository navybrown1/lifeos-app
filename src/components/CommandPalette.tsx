"use client";

import { useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  type: "section" | "entity" | "action";
  meta?: { sectionId?: number; entityName?: string };
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  sections: { id: number; title: string }[];
  entities: { name: string }[];
  onSelect: (item: CommandItem) => void;
}

export function CommandPalette({ open, onClose, sections, entities, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const items: CommandItem[] = [
    ...sections.map((s) => ({ id: `sec-${s.id}`, label: s.title, type: "section" as const, meta: { sectionId: s.id } })),
    ...entities.slice(0, 30).map((e) => ({ id: `ent-${e.name}`, label: e.name, type: "entity" as const, meta: { entityName: e.name } })),
    { id: "export-entities", label: "Export entities", type: "action" },
    { id: "export-requirements", label: "Export requirements checklist", type: "action" },
    { id: "export-summary", label: "Export analysis summary", type: "action" },
  ];

  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items.slice(0, 20);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(0, s - 1));
      }
      if (e.key === "Enter" && filtered[selected]) {
        e.preventDefault();
        onSelect(filtered[selected]);
        onClose();
      }
    },
    [open, onClose, filtered, selected, onSelect]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          placeholder="Search sections, entities, actions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-t-lg border-0 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto border-t border-border py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">No results</div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm flex items-center gap-2",
                  i === selected ? "bg-accent" : "hover:bg-accent/50"
                )}
                onMouseEnter={() => setSelected(i)}
              >
                <span className="text-muted-foreground text-xs w-16">{item.type}</span>
                {item.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
