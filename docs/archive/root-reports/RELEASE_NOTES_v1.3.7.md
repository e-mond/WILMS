# WILMS v1.3.7 Release Notes

**Release type:** Stable  
**Date:** July 2026  
**Previous:** v1.3.7-rc3

## Overview

v1.3.7 is the stable production release of the v1.3.7 line. It delivers accurate financial KPIs, pool-to-loan traceability, reconciliation lifecycle, human-readable identifiers, collector messaging and notifications, and an executive dashboard with cards/charts toggle.

## Highlights

| Area | What's included |
|------|-----------------|
| Financial dashboard | Cards ↔ charts (line, area, bar, pie); per-user preference persistence; net collections after expenses |
| Loan pools | Pool funds, disbursed, collected, outstanding, utilisation; allocation backfill migration `0025` |
| Disbursement | Responsive toolbar; nowrap loan table |
| Collections | Variance = collected − expected; reconciliation status on collections aside |
| Groups / loans / expenses | `GRP-`, `POOL-`, `LOAN-`, `EXP-` display IDs in UI and exports |
| Reconciliation | Auto-approve balanced; Super Admin review queue and dashboard summary |
| Expenses | Auto-recorded; deducted from operating cash; collector history |
| Notifications | In-app, push bridge, optional sounds |
| Product tour | Role-based walkthrough with route navigation and replay |
| Registration | Character counters; DOB 20+ validation; approver document preview |

## Financial model

See [docs/financial-calculations.md](./docs/financial-calculations.md).

```
Pool capital − Outstanding = Available to lend
Total collected − Expenses = Net collections (operating cash)
```

Each disbursement is linked to a pool via `loan_pool_id` and `DISBURSEMENT` allocation rows.

## Upgrade from rc3

1. `npm run db:migrate` in `apps/backend` (migrations through `0025`).
2. Verify `/health` → `schema.status: ok`.
3. Smoke-test: loan pool KPIs, daily collection variance, reconciliation submit/approve, collector inbox.

## Verification (release gate)

- [x] TypeScript type-check
- [x] ESLint
- [x] Production build
- [x] Backend unit tests (129)
- [x] Frontend unit tests
- [x] Version consistency (`verify:version`)
- [x] Bundle budget
- [ ] E2E Playwright (requires environment)
- [ ] Production smoke (`smoke:production` — requires credentials)

## Known limitations

- Product tour uses modal + route highlights; full per-element spotlights deferred to a future minor release.
- Full WCAG 2.2 AA audit across every screen not re-certified in this release (keyboard/ARIA patterns maintained).

---

# WILMS v1.3.7-rc3 Release Notes

**Release type:** Release Candidate (blocking fixes from manual QA)  
**Target stable:** v1.3.7  
**Date:** July 2026

## Overview

v1.3.7-rc3 closes production-blocking gaps found after rc2: loan pool KPI accuracy, financial reconciliation model, chart layout, disbursement toolbar overlap, and reconciliation status handling.

## Highlights

| Area | Change |
|------|--------|
| Loan pools | Backfill allocations; active pool count; Total Collected KPI |
| Financial model | Capital − outstanding; net collections after expenses |
| Dashboard charts | Overflow-safe labels and values in chart mode |
| Collections | Aside reconciliation status for selected report date |
| Reconciliation | Auto-approve balanced; fix false "Under review" |
| Product tour | Route navigation + highlighted targets per step |

## Verification

- [x] Backend type-check
- [x] Frontend type-check
- [x] Backend unit tests (129)
- [x] Frontend unit tests
- [ ] Run migrations `0024` + `0025` before production promote

---

# WILMS v1.3.7-rc2 Release Notes
