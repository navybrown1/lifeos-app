# Design Notes

## Entity Extraction

Entities are extracted using two approaches:

1. **Regex patterns** for domain-specific types:
   - **Person**: `Prof.`, `Professor`, `Dr.`, `Mr.`, `Ms.`, `Mrs.` +
   - **Organization**: `Inc.`, `Corp.`, `LLC`, `University`, `College`, `Institute`
   - **Date**: `MM/DD/YYYY`, `MM-DD-YYYY`, `Month DD, YYYY`
   - **Metric**: numbers with `%`, `MB`, `GB`, `km`, `miles`

2. **Capitalized phrases**: Multi-word phrases starting with capitals (e.g. "Project Alpha", "Requirements Specification") are captured as concepts. Common noise words ("The", "A", "If", etc.) are filtered out.

Type inference (person, org, date, metric, concept) is done heuristically from the entity string.

## Requirements Detection

Requirements are detected by scanning sentences for keywords:

- **must** / **shall** → `must` (high priority)
- **should** → `should` (medium)
- **may** → `may` (low)
- **definition** / **defined as** → `definition` (high)
- **constraint** / **required** → `constraint` (high)
- **rule** / **theorem** / **if and only if** → `rule` (medium)

Each match is tagged with section, type, and priority for the checklist.

## Confidence Flags

- **Explicit**: Content directly stated in the document (e.g. metadata from header, entities from text).
- **Inferred**: Generated summaries (e.g. first sentence of each section as "key takeaway"). These are heuristic-based and may not reflect author intent.

Sections with risk/ambiguity wording (`not`, `unlikely`, `error`, `fail`, `cannot`, `risk`, `uncertain`, `ambiguous`) receive a risk score. Higher score = more potential ambiguity.

## Risk Heuristics

The risk score per section is the count of risk-related words present. This is a simple heuristic; it does not capture semantic nuance. Used for the "Risk / Ambiguity" chart in Visual Insights.

## Q&A Grounding

The Q&A system uses a TF-IDF-style similarity over section text. If the best match score is below a threshold (0.1), the system returns "Not found in document" and suggests rephrasing. Answers always cite the source section and snippet.
