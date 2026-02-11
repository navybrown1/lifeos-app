"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";
import { RelationshipGraph } from "@/components/RelationshipGraph";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ExtractedData, Section, Entity, Requirement } from "@/lib/extraction";
import { buildQAIndex } from "@/lib/qa";

type TabId = "overview" | "outline" | "entities" | "requirements" | "insights" | "qa";

export default function DocumentIntelligencePage() {
  const [data, setData] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [qaQuery, setQaQuery] = useState("");
  const [qaResult, setQaResult] = useState<{ section: string; sectionId: number; snippet: string; fullText: string; score: number } | null>(null);

  const loadDocument = useCallback(async (file?: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("path", "sample.txt");
      }
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Parse failed");
      }
      const parsed: ExtractedData = await res.json();
      setData(parsed);
      setSelectedSectionId(parsed.sections[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCommandSelect = useCallback(
    (item: { id: string; type: string; meta?: { sectionId?: number; entityName?: string } }) => {
      if (item.meta?.sectionId != null) {
        setSelectedSectionId(item.meta.sectionId);
        setActiveTab("outline");
      }
      if (item.id === "export-entities") {
        if (data) {
          const csv = [
            "Name,Type,Mentions",
            ...data.entities.map((e) => `${e.name},${e.type},${e.mentions}`),
          ].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "entities.csv";
          a.click();
        }
      }
      if (item.id === "export-requirements") {
        if (data) {
          const csv = [
            "Text,Type,Section,Priority",
            ...data.requirements.map((r) => `"${r.text.replace(/"/g, '""')}",${r.type},${r.section},${r.priority}`),
          ].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "requirements.csv";
          a.click();
        }
      }
      if (item.id === "export-summary") {
        if (data) {
          const summary = {
            sections: data.sections.length,
            entities: data.entities.length,
            requirements: data.requirements.length,
            metadata: data.metadata,
          };
          const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "analysis-summary.json";
          a.click();
        }
      }
    },
    [data]
  );

  const handleQaSubmit = useCallback(() => {
    if (!data || !qaQuery.trim()) return;
    const getAnswer = buildQAIndex(data.sections);
    const ans = getAnswer(qaQuery.trim());
    setQaResult(ans);
  }, [data, qaQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Place a document in <code className="bg-muted px-1 rounded">documents/</code> (DOCX, PDF, or TXT), or upload below.
          </p>
          <input
            type="file"
            accept=".docx,.pdf,.txt"
            onChange={(e) => e.target.files?.[0] && loadDocument(e.target.files[0])}
            className="block mx-auto"
          />
          <Button className="mt-4" onClick={() => loadDocument()}>
            Retry with sample
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const selectedSection = data.sections.find((s) => s.id === selectedSectionId) ?? data.sections[0];
  const filteredSections = searchQuery.trim()
    ? data.sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data.sections;

  const topicData = Object.entries(data.entityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 12) + "..." : name, value }));

  const riskData = data.sections.map((s) => ({ title: s.title.length > 20 ? s.title.slice(0, 17) + "..." : s.title, risk: s.riskScore }));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Document Intelligence Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCmdOpen(true)}>
              ⌘K Search
            </Button>
            <input
              type="file"
              accept=".docx,.pdf,.txt"
              onChange={(e) => e.target.files?.[0] && loadDocument(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <Button variant="secondary" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
              Upload Document
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="outline">Outline Navigator</TabsTrigger>
            <TabsTrigger value="entities">Entities & Relationships</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="insights">Visual Insights</TabsTrigger>
            <TabsTrigger value="qa">Q&A Workbench</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab data={data} />
          </TabsContent>

          <TabsContent value="outline">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Sections</h3>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-border px-2 py-1 text-sm mb-2"
                />
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {filteredSections.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSectionId(s.id)}
                      className={`block w-full text-left px-2 py-1 rounded text-sm truncate ${
                        selectedSectionId === s.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-3 border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{selectedSection?.title}</h3>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                  {selectedSection?.text}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Word count: {selectedSection?.wordCount ?? 0} | Risk score: {selectedSection?.riskScore ?? 0}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="entities">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Entities</h3>
                <div className="border border-border rounded-lg overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2">Entity</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-right p-2">Mentions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entities.map((e) => (
                        <tr
                          key={e.name}
                          className="border-b border-border hover:bg-accent/50 cursor-pointer"
                          onClick={() => {
                            setSelectedSectionId(e.firstOccurrence.sectionId);
                            setActiveTab("outline");
                          }}
                        >
                          <td className="p-2">{e.name}</td>
                          <td className="p-2 text-muted-foreground">{e.type}</td>
                          <td className="p-2 text-right">{e.mentions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Relationship Graph</h3>
                <RelationshipGraph
                  sections={data.sections}
                  entities={data.entities}
                  entityCounts={data.entityCounts}
                  onNodeClick={(type, id) => {
                    if (type === "section") {
                      const sid = parseInt(id.replace("s-", ""), 10);
                      setSelectedSectionId(sid);
                      setActiveTab("outline");
                    }
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requirements">
            <RequirementsTab data={data} />
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Topic Frequency</h3>
                {topicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topicData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No entities for topic distribution.</p>
                )}
              </div>
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Risk / Ambiguity by Section</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={riskData}>
                    <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="risk" fill="hsl(0 84% 60%)" name="Risk score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {data.dates.length > 0 && (
                <div className="lg:col-span-2 border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Dates & Deadlines</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.dates.map((d, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-muted text-sm cursor-pointer hover:bg-accent"
                        title={d.context}
                        onClick={() => {
                          setSelectedSectionId(d.sectionId);
                          setActiveTab("outline");
                        }}
                      >
                        {d.date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qa">
            <div className="max-w-2xl">
              <h3 className="font-semibold mb-2">Ask the Document</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="e.g. What are the key requirements?"
                  value={qaQuery}
                  onChange={(e) => setQaQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQaSubmit()}
                  className="flex-1 rounded border border-border px-3 py-2"
                />
                <Button onClick={handleQaSubmit}>Search</Button>
              </div>
              {qaResult ? (
                <div className="border border-border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium mb-2">Answer</h4>
                  <blockquote className="border-l-4 border-primary pl-4 my-2">{qaResult.snippet}</blockquote>
                  <p className="text-sm text-muted-foreground">
                    Source: {qaResult.section} (Confidence: {(qaResult.score * 100).toFixed(0)}%)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSelectedSectionId(qaResult.sectionId);
                      setActiveTab("outline");
                    }}
                  >
                    Jump to section
                  </Button>
                </div>
              ) : qaQuery && (
                <div className="border border-border rounded-lg p-4 text-muted-foreground">
                  Not found in document. Try rephrasing or check the Outline tab.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        sections={data.sections.map((s) => ({ id: s.id, title: s.title }))}
        entities={data.entities.map((e) => ({ name: e.name }))}
        onSelect={handleCommandSelect}
      />
    </div>
  );
}

function OverviewTab({ data }: { data: ExtractedData }) {
  const intro = data.sections[0]?.text?.slice(0, 300) ?? "";
  const outro = data.sections.length > 1 ? data.sections[data.sections.length - 1]?.text?.slice(0, 300) ?? "" : "";
  const riskSections = data.sections.filter((s) => s.riskScore > 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Executive Summary</h3>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p><strong>Introduction:</strong> {intro}...</p>
            {outro && <p className="mt-2"><strong>Conclusion:</strong> {outro}...</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Key Takeaways</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {data.sections.slice(1, 5).map((s) => (
              <li key={s.id}>
                <strong>{s.title}</strong>: {s.text.split(".")[0]}.
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Metadata</h3>
        <dl className="space-y-1 text-sm">
          <dt className="text-muted-foreground">Author</dt>
          <dd>{data.metadata.author ?? "Unknown"}</dd>
          <dt className="text-muted-foreground">Date</dt>
          <dd>{data.metadata.date ?? "Unknown"}</dd>
          <dt className="text-muted-foreground">Sections</dt>
          <dd>{data.sections.length}</dd>
          <dt className="text-muted-foreground">Entities</dt>
          <dd>{data.entities.length}</dd>
          <dt className="text-muted-foreground">Sections with risk wording</dt>
          <dd>{riskSections}</dd>
        </dl>
      </div>
    </div>
  );
}

function RequirementsTab({ data }: { data: ExtractedData }) {
  const [filter, setFilter] = useState<string[]>([]);

  const types = Array.from(new Set(data.requirements.map((r) => r.type)));
  const filtered =
    filter.length > 0 ? data.requirements.filter((r) => filter.includes(r.type)) : data.requirements;

  const exportChecklist = (format: "csv" | "json") => {
    const rows = filtered.map((r) => ({
      text: r.text,
      type: r.type,
      section: r.section,
      priority: r.priority,
      rationale: `Section: ${r.section}`,
      verification: "Manual review",
    }));
    if (format === "json") {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "requirements-checklist.json";
      a.click();
    } else {
      const csv = [
        "Text,Type,Section,Priority,Rationale,Verification",
        ...rows.map((r) =>
          [
            `"${r.text.replace(/"/g, '""')}"`,
            r.type,
            r.section,
            r.priority,
            r.rationale,
            r.verification,
          ].join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "requirements-checklist.csv";
      a.click();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setFilter((f) => (f.includes(t) ? f.filter((x) => x !== t) : [...f, t]))
              }
              className={`px-3 py-1 rounded text-sm ${
                filter.length === 0 || filter.includes(t) ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportChecklist("csv")}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportChecklist("json")}>
            Export JSON
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {filtered.map((r, i) => (
          <RequirementCard key={i} req={r} onJump={() => {}} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-muted-foreground">No requirements detected.</p>
      )}
    </div>
  );
}

function RequirementCard({ req, onJump }: { req: Requirement; onJump: () => void }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase">{req.type}</span>
          <p className="mt-1">{req.text}</p>
          <p className="text-sm text-muted-foreground mt-2">Source: {req.section}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-muted">{req.priority}</span>
      </div>
    </div>
  );
}
