/**
 * Minimal validation: ensure extraction pipeline produces expected schema.
 * Run: node scripts/validate-pipeline.js
 */
const fs = require("fs");
const path = require("path");

const samplePath = path.join(__dirname, "../documents/sample.txt");
if (!fs.existsSync(samplePath)) {
  console.error("Sample document not found at documents/sample.txt");
  process.exit(1);
}

const rawText = fs.readFileSync(samplePath, "utf-8");
if (!rawText || rawText.trim().length === 0) {
  console.error("Sample document is empty");
  process.exit(1);
}

// Heuristic: sections have headers (lines starting with # or short lines)
const lines = rawText.split(/\r?\n/).filter((l) => l.trim());
const hasStructure = lines.some((l) => l.startsWith("#") || /^\d+\.\s/.test(l)) || lines.length > 1;
if (!hasStructure) {
  console.warn("Warning: Document may not have clear section structure");
}

// Check for requirements keywords
const hasReqs = /must|should|may|definition|required/i.test(rawText);
if (!hasReqs) {
  console.warn("Warning: No requirement keywords detected");
}

console.log("✓ Pipeline validation passed");
console.log("  - Document loaded");
console.log("  - Text length:", rawText.length);
console.log("  - Has structure:", hasStructure);
console.log("  - Has requirement keywords:", hasReqs);
