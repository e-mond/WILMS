# Agent Instructions — WILMS
> Women's Interest-Free Loan Management System

Before any implementation or architectural decision, read these files **in order**:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-context.md`
4. `context/code-standards.md`
5. `context/ai-workflow-rules.md`
6. `context/progress-tracker.md`
7. `context/requirements-traceability.md`
8. `context/adrs/ADR-001-state-management.md`
9. `context/adrs/ADR-002-routing-strategy.md`
10. `context/adrs/ADR-003-api-layer-design.md`
11. `context/adrs/ADR-004-component-architecture.md`
12. `production-frontend-prompt.md`

---

## Rules

- For implementation tasks, follow the response format defined in `production-frontend-prompt.md` Section 21 (Final Response Format).
- Update `context/progress-tracker.md` after every meaningful implementation change.
- Update `context/requirements-traceability.md` as features are completed — mark each row's Status field.
- If any context file is outdated relative to the implementation, update it before continuing development.
- If the current project state cannot be determined from these files, ask before implementing anything.
- Never make architectural decisions without creating or updating the relevant ADR in `context/adrs/`.
- Every new session begins by reading all context files — no exceptions.

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

See `context/ai-workflow-rules.md` §5 for the full list of BRD ambiguities and their resolutions. Do not re-open resolved ambiguities without a stakeholder directive.

---

## Definition of Done

A feature unit is complete **only** when ALL of the following are true:

- [ ] All BRD requirements for this unit are implemented (traceable in requirements-traceability.md)
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] UI (Playwright) tests written and passing
- [ ] Coverage thresholds met (80% statements, 75% branches, 80% functions, 80% lines)
- [ ] Accessibility verified (WCAG 2.1 AA) for all UI added
- [ ] Security reviewed (no banned patterns from code-standards.md)
- [ ] `npm run lint` passes — zero errors
- [ ] `npm run type-check` passes — zero errors
- [ ] `npm run build` succeeds
- [ ] `context/progress-tracker.md` updated
- [ ] `context/requirements-traceability.md` rows updated to ✅ Complete
- [ ] Relevant ADR created or updated if an architectural decision was made

If any item is unchecked, the unit is **not complete**.
