# WILMS Architecture Documentation

This folder contains frontend-oriented architecture context (UI shell, code standards, ADRs linkage).

For **current system architecture** (API + DB + auth + financial flow), use:

- [`docs/certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md`](../certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md)
- Phase 17 recommendations: [`../certification/v1.3.8/enterprise-architecture/INDEX.md`](../certification/v1.3.8/enterprise-architecture/INDEX.md)

## Field operations docs (repository `docs/`)

- `offline-architecture.md` — offline mode, PWA shell, queues
- `synchronization-guide.md` — sync API, conflict resolution
- `device-management.md` — battery, storage, compression
- `mobile-guide.md` — PWA install, camera, scanning
- `advanced-lending.md` — cadences, grace, fees, penalties
- `api-overview.md` — REST API narrative overview
- `permission-matrix.md` — role × permission table

## Source of Truth

`WILMS_BRD_v1.0.pdf` at the project root is the authoritative business source.

Supporting product docs in this folder:

- `project-overview.md` — product summary, personas, journeys
- `requirements-traceability.md` — requirement-to-implementation mapping
- `architecture.md` — UI/dashboard shell architecture
- `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`

## ADRs

Canonical ADRs live in [`docs/adr/`](../adr/) (not under a legacy `context/` path).

## Folder layout

```text
docs/architecture/
├── README.md                 ← this file
├── project-overview.md
├── architecture.md
├── ui-context.md
├── code-standards.md
├── ai-workflow-rules.md
├── progress-tracker.md
├── requirements-traceability.md
├── design-reference-analysis.md
├── gap-analysis-report.md
├── accessibility-audit.md
├── export-strategy.md
└── design-references/        ← approved dashboard visuals (if present)
```
