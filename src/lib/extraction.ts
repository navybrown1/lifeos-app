/**
 * Document extraction pipeline - parses and analyzes documents.
 * Supports DOCX, PDF, and plain text. All content derived at runtime.
 */

export interface Section {
  id: number;
  title: string;
  text: string;
  content: string[];
  wordCount: number;
  riskScore: number;
  entities: string[];
  rules: Requirement[];
}

export interface Requirement {
  text: string;
  type: "must" | "should" | "may" | "definition" | "constraint" | "rule";
  section: string;
  sectionId: number;
  priority: "high" | "medium" | "low";
}

export interface Entity {
  name: string;
  type: string;
  mentions: number;
  firstOccurrence: { sectionId: number; sectionTitle: string; snippet: string };
  lastOccurrence: { sectionId: number; sectionTitle: string; snippet: string };
}

export interface ExtractedData {
  sections: Section[];
  fullText: string;
  metadata: Record<string, string>;
  entities: Entity[];
  entityCounts: Record<string, number>;
  requirements: Requirement[];
  dates: Array<{ date: string; context: string; sectionId: number }>;
}

const ENTITY_TYPES = {
  person: /(?:Prof\.|Professor|Dr\.|Mr\.|Ms\.|Mrs\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
  org: /\b(?:Inc\.|Corp\.|LLC|Ltd\.|Company|University|College|Institute)\b[^.]*?(?=\s|$)/g,
  date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/g,
  metric: /\b\d+(?:\.\d+)?\s*(?:%|percent|MB|GB|TB|km|miles)\b/gi,
};

const REQUIREMENT_PATTERNS = [
  { pattern: /\bmust\b/i, type: "must" as const, priority: "high" as const },
  { pattern: /\bshall\b/i, type: "must" as const, priority: "high" as const },
  { pattern: /\bshould\b/i, type: "should" as const, priority: "medium" as const },
  { pattern: /\bmay\b/i, type: "may" as const, priority: "low" as const },
  { pattern: /\bdefinition\b|\bdefined as\b/i, type: "definition" as const, priority: "high" as const },
  { pattern: /\bconstraint\b|\brequired\b/i, type: "constraint" as const, priority: "high" as const },
  { pattern: /\brule\b|\btheorem\b|\bif and only if\b/i, type: "rule" as const, priority: "medium" as const },
];

const RISK_WORDS = ["not", "unlikely", "error", "fail", "cannot", "must not", "risk", "uncertain", "ambiguous"];

const NOISE_WORDS = new Set(["The", "A", "An", "If", "In", "For", "Now", "But", "My", "This", "That", "These", "Those"]);

export function parseSectionsFromText(fullText: string): Section[] {
  const lines = fullText.split(/\r?\n/).filter((l) => l.trim());
  const sections: Section[] = [];
  let current: { title: string; content: string[] } = { title: "Introduction", content: [] };
  let sectionId = 0;

  const isHeader = (line: string, prevLine: string): boolean => {
    if (line.length > 80) return false;
    if (/^\d+\.\s+.+/.test(line)) return true;
    if (line === line.toUpperCase() && line.length > 2) return true;
    if (/^#{1,6}\s/.test(line)) return true;
    const words = line.split(/\s+/);
    if (words.length <= 6 && line[0] === line[0].toUpperCase()) return true;
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = lines[i - 1] ?? "";
    if (isHeader(line, prev) && current.content.length > 0) {
      sections.push(buildSection(sectionId++, current));
      current = { title: line.replace(/^#+\s*|\d+\.\s*/, "").trim(), content: [] };
    } else if (!isHeader(line, prev)) {
      current.content.push(line);
    }
  }
  if (current.content.length > 0 || current.title) {
    sections.push(buildSection(sectionId++, current));
  }
  return sections.length ? sections : [{ ...buildSection(0, { title: "Document", content: fullText ? [fullText] : [] }), id: 0 }];
}

function buildSection(id: number, { title, content }: { title: string; content: string[] }): Section {
  const text = content.join("\n");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const riskScore = RISK_WORDS.reduce((n, w) => n + (text.toLowerCase().includes(w) ? 1 : 0), 0);
  const entities = extractEntitiesFromText(text);
  const rules = extractRequirementsFromText(text, title, id);
  return { id, title, text, content, wordCount, riskScore, entities, rules };
}

function extractEntitiesFromText(text: string): string[] {
  const found = new Set<string>();
  for (const [, regex] of Object.entries(ENTITY_TYPES)) {
    const matches = text.match(regex);
    if (matches) matches.forEach((m) => found.add(m.trim()));
  }
  const capPhrases = text.match(/(?<!^)(?<!\. )[A-Z][a-z]+(?: [A-Z][a-z]+)*/g) ?? [];
  capPhrases.forEach((c) => {
    if (c.length > 3 && !NOISE_WORDS.has(c)) found.add(c);
  });
  return Array.from(found);
}

function extractRequirementsFromText(text: string, sectionTitle: string, sectionId: number): Requirement[] {
  const requirements: Requirement[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sent of sentences) {
    const lower = sent.toLowerCase();
    for (const { pattern, type, priority } of REQUIREMENT_PATTERNS) {
      if (pattern.test(lower)) {
        requirements.push({ text: sent.trim(), type, section: sectionTitle, sectionId, priority });
        break;
      }
    }
  }
  return requirements;
}

export function processExtractedData(sections: Section[]): ExtractedData {
  const fullText = sections.map((s) => s.text).join("\n");
  const metadata: Record<string, string> = {};
  const firstLines = sections[0]?.text?.slice(0, 500) ?? "";
  const authorMatch = firstLines.match(/(?:Prof\.|Professor|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/);
  if (authorMatch) metadata.author = authorMatch[0];
  const dateMatch = fullText.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
  if (dateMatch) metadata.date = dateMatch[0];

  const entityCounts: Record<string, number> = {};
  for (const s of sections) {
    for (const e of s.entities) {
      entityCounts[e] = (entityCounts[e] ?? 0) + 1;
    }
  }

  const entities: Entity[] = [];
  for (const [name, count] of Object.entries(entityCounts)) {
    if (count < 1) continue;
    let firstOcc: { sectionId: number; sectionTitle: string; snippet: string } | null = null;
    let lastOcc: { sectionId: number; sectionTitle: string; snippet: string } | null = null;
    const re = new RegExp(`(${escapeRegex(name)}).{0,50}`, "gi");
    for (const sec of sections) {
      const m = sec.text.match(re);
      if (m) {
        const snippet = m[0].length > 80 ? m[0].slice(0, 80) + "..." : m[0];
        const occ = { sectionId: sec.id, sectionTitle: sec.title, snippet };
        if (!firstOcc) firstOcc = occ;
        lastOcc = occ;
      }
    }
    if (firstOcc && lastOcc) {
      entities.push({ name, type: inferEntityType(name), mentions: count, firstOccurrence: firstOcc, lastOccurrence: lastOcc });
    }
  }

  const requirements = sections.flatMap((s) => s.rules);

  const dates: Array<{ date: string; context: string; sectionId: number }> = [];
  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi;
  for (const sec of sections) {
    const matches = Array.from(sec.text.matchAll(dateRegex));
    for (const m of matches) {
      dates.push({ date: m[1], context: m[0], sectionId: sec.id });
    }
  }

  return { sections, fullText, metadata, entities, entityCounts, requirements, dates };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferEntityType(name: string): string {
  if (/\d{1,2}[\/\-]\d/.test(name)) return "date";
  if (/(?:Inc|Corp|LLC|Ltd|University|College)/i.test(name)) return "organization";
  if (/(?:Prof|Dr|Mr|Ms|Mrs)\./i.test(name)) return "person";
  if (/%|MB|GB|TB|km|miles/i.test(name)) return "metric";
  return "concept";
}
