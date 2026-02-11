/**
 * Q&A workbench - grounded answers with document citations.
 * Uses simple TF-IDF style matching. Returns null if no confident match.
 */

import type { Section } from "./extraction";

export interface QAResult {
  section: string;
  sectionId: number;
  snippet: string;
  fullText: string;
  score: number;
}

export function buildQAIndex(sections: Section[]): (query: string) => QAResult | null {
  const corpus = sections.map((s) => s.text).filter((t) => t.trim());
  if (corpus.length === 0) return () => null;

  const tokenize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "can", "of", "in", "to", "for", "with", "on", "at", "by", "from"]);

  const docTokens = corpus.map((t) => {
    const tokens = tokenize(t).filter((w) => !stopWords.has(w));
    const counts: Record<string, number> = {};
    for (const w of tokens) counts[w] = (counts[w] ?? 0) + 1;
    return counts;
  });

  const df: Record<string, number> = {};
  for (const doc of docTokens) {
    for (const w of Object.keys(doc)) {
      df[w] = (df[w] ?? 0) + 1;
    }
  }

  const N = corpus.length;
  const idf = (w: string) => Math.log((N + 1) / ((df[w] ?? 0) + 1)) + 1;

  return (query: string): QAResult | null => {
    const qTokens = tokenize(query).filter((w) => !stopWords.has(w));
    if (qTokens.length === 0) return null;

    let bestIdx = -1;
    let bestScore = 0.1;

    for (let i = 0; i < corpus.length; i++) {
      const docT = docTokens[i];
      let score = 0;
      for (const w of qTokens) {
        const tf = docT[w] ?? 0;
        if (tf > 0) score += tf * idf(w);
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) return null;

    const section = sections[bestIdx];
    const sentences = section.text.split(/(?<=[.!?])\s+/);
    let bestSent = sentences[0] ?? section.text;
    let maxOverlap = 0;
    const qSet = new Set(qTokens);
    for (const sent of sentences) {
      const sSet = new Set(tokenize(sent).filter((w) => !stopWords.has(w)));
      const overlap = Array.from(qSet).filter((w) => sSet.has(w)).length;
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestSent = sent;
      }
    }

    return {
      section: section.title,
      sectionId: section.id,
      snippet: bestSent,
      fullText: section.text,
      score: Math.min(1, bestScore / 10),
    };
  };
}
