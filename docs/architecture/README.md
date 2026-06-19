# WILMS Context Documentation

This folder contains project context files referenced by `AGENTS.md` and
`production-frontend-prompt.md`.

## Source of Truth

`WILMS_BRD_v1.0.pdf` at the project root is the authoritative business source.
Place or update it there when a new BRD version is issued.

Until the BRD PDF is available, use:

- `project-overview.md` — product summary, personas, journeys
- `requirements-traceability.md` — requirement-to-implementation mapping

## Folder Layout

```text
context/
├── project-overview.md
├── architecture.md
├── ui-context.md
├── code-standards.md
├── ai-workflow-rules.md
├── progress-tracker.md
├── requirements-traceability.md
├── design-references/     ← Approved dashboard JPEGs (binding visual requirements)
├── design-reference-analysis.md
├── gap-analysis-report.md
└── adrs/
    ├── ADR-001-state-management.md
    ├── ADR-002-routing-strategy.md
    ├── ADR-003-api-layer-design.md
    ├── ADR-004-component-architecture.md
    └── ADR-005-dashboard-shell-architecture.md
```

## Reading Order

See `AGENTS.md` at the project root for the mandatory pre-session reading order.
