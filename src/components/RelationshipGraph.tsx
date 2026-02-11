"use client";

import { useMemo } from "react";
import type { Section, Entity } from "@/lib/extraction";

interface GraphProps {
  sections: Section[];
  entities: Entity[];
  entityCounts: Record<string, number>;
  onNodeClick?: (type: "section" | "entity", id: string) => void;
}

export function RelationshipGraph({ sections, entities, entityCounts, onNodeClick }: GraphProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: { id: string; label: string; type: "section" | "entity"; x: number; y: number }[] = [];
    const edges: { from: string; to: string }[] = [];

    const sectionPositions = new Map<number, { x: number; y: number }>();
    const radius = 150;
    sections.forEach((s, i) => {
      const angle = (i / Math.max(sections.length, 1)) * 2 * Math.PI - Math.PI / 2;
      sectionPositions.set(s.id, { x: 200 + radius * Math.cos(angle), y: 200 + radius * Math.sin(angle) });
      nodes.push({
        id: `s-${s.id}`,
        label: s.title.length > 25 ? s.title.slice(0, 22) + "..." : s.title,
        type: "section",
        x: 200 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle),
      });
    });

    const topEntities = entities.filter((e) => e.mentions > 1).slice(0, 12);
    const entRadius = 80;
    topEntities.forEach((e, i) => {
      const angle = (i / Math.max(topEntities.length, 1)) * 2 * Math.PI;
      const x = 200 + entRadius * Math.cos(angle);
      const y = 200 + entRadius * Math.sin(angle);
      nodes.push({ id: `e-${e.name}`, label: e.name.length > 15 ? e.name.slice(0, 12) + "..." : e.name, type: "entity", x, y });
      const secId = e.firstOccurrence.sectionId;
      const sec = sections.find((s) => s.id === secId);
      if (sec) edges.push({ from: `e-${e.name}`, to: `s-${sec.id}` });
    });

    return { nodes, edges };
  }, [sections, entities]);

  return (
    <div className="relative w-full h-[400px] bg-muted/30 rounded-lg border border-border overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 400 400" className="overflow-visible">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const fromN = nodes.find((n) => n.id === e.from);
          const toN = nodes.find((n) => n.id === e.to);
          if (!fromN || !toN) return null;
          return (
            <line
              key={i}
              x1={fromN.x}
              y1={fromN.y}
              x2={toN.x}
              y2={toN.y}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.4}
              strokeWidth={1}
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.type === "section" ? 24 : 12}
              fill={n.type === "section" ? "hsl(var(--primary))" : "hsl(0 84% 60%)"}
              fillOpacity={0.9}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNodeClick?.(n.type, n.id)}
            />
            <text
              x={n.x}
              y={n.y + (n.type === "section" ? 32 : 20)}
              textAnchor="middle"
              fontSize={n.type === "section" ? 10 : 9}
              fill="hsl(var(--foreground))"
              className="pointer-events-none"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
