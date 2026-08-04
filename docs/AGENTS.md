# Agent environment notes — WILMS

Before implementation decisions, prefer current sources of truth:

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md)
2. Root [`README.md`](../README.md)
3. [`environment.md`](./environment.md)
4. [`authentication.md`](./authentication.md)
5. Certification packs under [`certification/`](./certification/) only as historical evidence
6. Root [`AGENTS.md`](../AGENTS.md) for monorepo commands
7. [`architecture/progress-tracker.md`](./architecture/progress-tracker.md) when tracking units

## Rules

- Prefer current hub docs over archived phase notes.
- Update `architecture/progress-tracker.md` after meaningful implementation changes when that tracker is in use.
- Record architectural decisions in [`adr/`](./adr/).
- Do not invent production vendor APM integrations unless code shows them.
- Do not add personal or AI/tool attribution to project artifacts.

## Non-negotiable product rules

See root [`AGENTS.md`](../AGENTS.md) and [`FINANCIAL_MODEL.md`](./FINANCIAL_MODEL.md) / BRD-derived rules (no partial payments, admin fee before disbursement, immutable audit log, etc.).
