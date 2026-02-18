# Document Intelligence Dashboard

A dynamic, interactive web app for exploring documents like a product—not a report. Extract entities, requirements, relationships, and run grounded Q&A.

## Quick Start

### Install

```bash
cd document-intelligence-app
npm install
```

### Run

```bash
npm run dev
```

Open []

### Where to Place Your Document

1. **Upload**: Use the "Upload Document" button in the header.
2. **Local file**: Place your document in the `documents/` folder and the app will try to load `documents/sample.txt` by default. To load a different file, modify the default path in the app or use the upload flow.

Supported formats: **DOCX**, **PDF**, **TXT**.

## Features

| Tab | Description |
|-----|-------------|
| **Overview** | Executive summary, key takeaways, metadata, confidence flags |
| **Outline Navigator** | Clickable section tree, search, section viewer with highlights |
| **Entities & Relationships** | Entity table, relationship graph, click-to-jump |
| **Requirements** | Auto-detected must/should/may statements, checklist, CSV/JSON export |
| **Visual Insights** | Topic frequency, risk heatmap, timeline (dates) |
| **Q&A Workbench** | Ask questions; answers grounded in document with citations |

## Keyboard Shortcuts

- **⌘K / Ctrl+K**: Open command palette (search sections, entities, export actions)

## Export Options

- **Entities**: CSV via command palette
- **Requirements checklist**: CSV via Requirements tab or command palette
- **Analysis summary**: JSON via command palette

## Screenshots

Run the app, then capture screens of each tab. Example: `Overview` shows executive summary and key takeaways; `Entities & Relationships` shows the entity table and relationship graph.

## Tech Stack

- Next.js 14 + React + TypeScript
- Tailwind CSS
- Recharts
- mammoth (DOCX), pdf-parse (PDF)

## Design Notes

See [DESIGN_NOTES.md](./DESIGN_NOTES.md) for extraction heuristics, entity detection, and confidence/risk logic.
