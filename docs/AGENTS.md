# Agent Instructions — WILMS
> Women's Interest-Free Loan Management System

**Version:** v1.3.8  
**Last updated:** 2026-07-17

Before any implementation or architectural decision, read these files **in order**:

1. [`architecture/project-overview.md`](./architecture/project-overview.md)
2. [`certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md`](./certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md) (current SSoT)
3. [`architecture/architecture.md`](./architecture/architecture.md) (legacy index / ADRs context)
4. [`architecture/ui-context.md`](./architecture/ui-context.md)
5. [`architecture/code-standards.md`](./architecture/code-standards.md)
6. [`architecture/ai-workflow-rules.md`](./architecture/ai-workflow-rules.md)
7. [`architecture/progress-tracker.md`](./architecture/progress-tracker.md)
8. [`architecture/requirements-traceability.md`](./architecture/requirements-traceability.md)
9. [`adr/ADR-001-state-management.md`](./adr/ADR-001-state-management.md) (and sibling ADRs as needed)
10. Root [`AGENTS.md`](../AGENTS.md) for Cursor Cloud monorepo commands
11. Frontend prompt (if UI work): [`../apps/frontend/production-frontend-prompt.md`](../apps/frontend/production-frontend-prompt.md)

> Paths formerly under `docs/context/` now live under `docs/architecture/` and `docs/adr/`.

---

## Rules

- Prefer certification packs under `docs/certification/v1.3.8/` for current operational and architectural truth.
- Update `architecture/progress-tracker.md` after meaningful implementation changes when that tracker is still in use for the task.
- Never make architectural decisions without creating or updating the relevant ADR in `docs/adr/`.
- Do not invent production failures or claim vendor APM (Sentry/OTel) is wired unless code shows it.

---

## WILMS-Critical Rules (Never Override)

These come from the BRD and represent non-negotiable system behaviour:

| Rule | BRD Reference |
|---|---|
| No partial payments — full weekly amount or nothing | §9.1 |
| No advance payments — only current week + arrears | §9.1 |
| Payments always clear oldest unpaid obligation first | §9.1 |
| No manual balance entries — all balances derived from transaction sum | §11.1 |
| Admin fee must be confirmed before loan disbursement | §6 |
| Same-day edits only for Collectors; locked after payment day ends | §9.3 |
| All adjustments require Super Admin approval | §9.3, §11.2 |
| Audit log is immutable — no records may be deleted | §13.2 |
| GPS coordinates auto-captured for every field payment; GPS denial blocks submission | §13.2 |
| Overpayment blocked and flagged for review | §10.1, §16 |
| Duplicate transactions (same borrower + date + amount) blocked | §16 |
| Blacklisted borrowers cannot register, receive loans, or act as guarantor | §4.2 |
| No component, hook, or state store may import from `src/mocks/` directly | ADR-003 |
| Role-restricted UI elements must be removed (render null), not hidden with CSS | ADR-002 |
| All GHS amounts displayed via `<CurrencyAmount />` component; internally stored as pesewas | ADR-004 |

---

## Ambiguities (Resolved)

See [`architecture/ai-workflow-rules.md`](./architecture/ai-workflow-rules.md) for BRD ambiguity resolutions. Do not re-open resolved ambiguities without a stakeholder directive.

---

## Product boundary: Borrower portal

WILMS v1.3.8 has **five staff portals** (Super Admin, Registration Officer, Approver, Collector, Auditor). There is **no borrower self-service login role**. Borrowers are domain entities managed by staff. A future borrower portal is a product roadmap item, not an acceptance defect.
