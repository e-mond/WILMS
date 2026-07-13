# WILMS v1.3.7-rc2 Release Notes

**Release type:** Release Candidate (UI, financial visibility & workflow)  
**Target stable:** v1.3.7  
**Date:** July 2026

## Overview

v1.3.7-rc2 improves executive financial visibility, human-readable identifiers, collector workflows, notifications, reconciliation tracking, and responsive layout across disbursement, collections, expenses, and audit modules.

## Highlights

| Area | Change |
|------|--------|
| Financial dashboard | Cards/Charts toggle; KPIs reconcile loans + pool allocations |
| Display IDs | `POOL-2026-001`, `GRP-2026-015`, `EXP-2026-042`, loan fallbacks |
| Expenses | Auto-recorded (no approval); collector history view |
| Reconciliation | Lifecycle statuses + Super Admin alerts |
| Messaging | Collector inbox notifications + push |
| Audit log | Period grouping, search, pagination |
| Resilience | Stale bundle auto-recovery after deploy |

## Verification

- [x] Backend type-check
- [x] Frontend type-check
- [x] ESLint
- [x] Backend unit tests (128)
- [x] Frontend unit tests (482)

---

# WILMS v1.3.7-rc1 Release Notes

**Release type:** Release Candidate (stability & business logic)  
**Target stable:** v1.3.7  
**Date:** July 2026

## Overview

v1.3.7-rc1 focuses on stabilising production workflows, correcting business logic, and improving executive financial visibility — not new feature development.

## Root Cause Analysis (Key Issues)

| Issue | Root cause | Fix |
|-------|------------|-----|
| Admin fee status 403 | `assertBorrowerReadAccess` required group membership; admin-fee queue lists all approved borrowers before assignment | Permission-based access aligned with `awaiting-admin-fee` and `POST /transactions/admin-fee` |
| Remember Me clears fields | `reset()` re-ran on every `rememberedEmail` change while live-sync effect updated store on each keystroke | Initialise form once on hydration; persist email on checkbox toggle / successful login only |
| Dashboard KPI mismatch | Production API used different KPI ids than design spec/mock | Backend returns `pool`, `disbursed`, `collected`, `outstanding` + `financialOverview` object |
| Review table missing names | Backend returned `id`/`fullName` instead of frontend contract | Audit-log-based `listReviewedApplications` with `borrowerName` and `reviewedBy` |

## Bugs Fixed

- Admin fee status false 403 for collectors
- Login Remember email clearing credentials
- Reviewed applications API/table contract mismatch
- Technical Zod validation messages on registration
- Approver Pending vs Offline identical nav icons

## Enhancements

- Super Admin financial overview panels (backend-calculated)
- Registration wizard step progress bar
- Borrower DOB validation (20+ years, no future dates)
- Admin fee error states distinguish 403 vs not found

## Verification

- [x] Backend type-check
- [x] Frontend type-check
- [x] ESLint
- [x] Production build
- [x] Backend unit tests (122/122)
- [x] Frontend unit tests (356/356)
- [x] Version consistency (`verify:version`)
- [x] Bundle budget (`bundle:budget-check`)
- [x] Financial endpoints RBAC audit test
- [ ] E2E regression suite (Playwright — requires environment)
- [ ] Production smoke (`smoke:production` — requires credentials)
- [ ] Git tag `v1.3.7-rc1` (after gate sign-off)

## Production Verification Report (2026-07-12)

| Gate | Result |
|------|--------|
| TypeScript | PASS |
| ESLint | PASS |
| Build | PASS |
| Backend tests | PASS (122) |
| Frontend tests | PASS (356) |
| Version consistency | PASS |
| Bundle budget | PASS (JS 168.4 KB gzip / 350 KB) |
| Financial RBAC audit | PASS |
| E2E | Not run (no Playwright env in CI agent) |
| Production smoke | Not run (requires live credentials) |

## Known Issues / Deferred

- Full WCAG 2.2 AA audit across all screens (partial improvements only)
- Complete financial permission audit of every endpoint (admin fee path fixed; broader audit deferred)
- E2E regression suite expansion
- Production migration `0020` still required for `organization_holidays` (loan creation degrades gracefully)

## Upgrade Notes

1. Run `npm run db:migrate` in `apps/backend` before promoting to stable.
2. Verify `/health` reports `schema.status: ok`.
3. Smoke-test collector admin-fee queue → record fee → disbursement eligibility.
