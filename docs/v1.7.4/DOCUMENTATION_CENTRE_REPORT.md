# WILMS v1.7.4 — Documentation Centre Report

## Summary

Delivers an in-application Documentation Centre that renders the existing v1.7.3 documentation library as a book-quality knowledge portal.

## Capabilities

- Browse by category with persistent library sidebar
- Render Markdown with professional typography (not raw source)
- Interactive on-page table of contents
- Full-library search with snippets
- PDF and Word downloads from `/documentation/pdf|docx`
- Print styles and presentation mode
- Favourites, bookmarks, and reading progress (local)
- Version selector UI (latest library: v1.7.4)
- Settings → Documentation entry
- Super Admin sidebar entry (**Documentation Centre**)

## Pipelines

- `npm run docs:generate` — branded PDF/DOCX from Markdown sources
- `npm run docs:sync` — copy library into `apps/frontend/public/documentation`
- `npm run docs:prepare` — generate then sync

## Guarantees preserved

Financial engine, RBAC, reconciliation, notifications, and scheduler behaviour unchanged.
