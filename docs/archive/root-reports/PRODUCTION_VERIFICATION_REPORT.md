# WILMS Production Verification Report

**Date:** 2026-07-05  
**Release target:** v1.1.1  
**Verifier:** Automated + branch-local regression

---

## Executive summary

Current **production is healthy** on v1.1 (`d2a64bb`). Smoke and RBAC suites pass. The **v1.1.1 hotfix** (`8dcda6e`) is verified locally but **not yet merged to `main` or deployed to Railway**. Vercel frontend partially reflects v1.1.1 branding.

**Gate status:** Conditional GO for v1.1 production. v1.1.1 completion requires PR merge + dual deploy + re-verification.

---

## Deployment SHA verification

| Surface | Commit / version | Status |
|---------|------------------|--------|
| Railway API | `d2a64bb` / health `1.0.0` | Live |
| Vercel app | Login label `v1.1.1` | Partial (UI) |
| Local hotfix branch | `8dcda6e` / package `1.1.1` | Ready for merge |

---

## Automated test results (hotfix branch)

| Suite | Target | Result |
|-------|--------|--------|
| `type-check` | frontend + api | **PASS** |
| `lint` | frontend | **PASS** |
| `build` | Next.js production | **PASS** |
| Backend tests | vitest | **53/53 PASS** |
| Frontend tests | vitest (2 shards) | **438/438 PASS** |
| `verify:api-integrity` | static route match | **PASS** (143 matched) |
| `verify:mock-guard` | no mock in features | **PASS** |
| `bundle:budget-check` | 168.6 KB gzip JS | **PASS** (budget 350 KB) |
| `perf:budget-check` | bundle budgets | **PASS** |
| `smoke:production` | live production | **32/32 PASS** |
| `smoke:rbac` | live production | **11/11 PASS** |

---

## Hotfix verification matrix

| Area | Local / code | Production (pre-deploy) |
|------|--------------|-------------------------|
| Registration addresses + React #185 | Fixed in `8dcda6e` | Pending deploy |
| Navigation single-active | Fixed + unit tests | Pending deploy |
| Audit action labels | Fixed | Pending deploy |
| `DIS-*` disbursement IDs | Migration + API | Pending deploy |
| Disburse loan button | Added to loan detail | Pending deploy |
| Group member `displayId` | Backend + UI | Pending deploy |
| Loan pool form UX | FormField + submit | Pending deploy |
| Switch pill UI | Updated component | Pending deploy |

---

## Manual UX checklist (post-deploy)

- [ ] Registration: home/business address typing, autosave, draft restore
- [ ] Loan pool create: validation, tab order, keyboard submit
- [ ] Disbursements: `DIS-YYYY-NNNNNN` in UI, exports, payment log
- [ ] Disburse workflow: Pending → Disburse → Active
- [ ] Groups: `BWR-*` member IDs
- [ ] Navigation: single active item (Collections vs Reports)
- [ ] Audit log: readable action labels for login, loans, settings
- [ ] Switches: settings panels across all roles
- [ ] Empty/error states: no generic "Check your connection" on empty data

---

## Performance

| Check | Result |
|-------|--------|
| Bundle budget | PASS (168.6 KB gzip JS) |
| Lighthouse | Not run on production (run on staging post-deploy) |
| Hydration / console | No regressions in test suite; manual browser check post-deploy |

---

## Outstanding technical debt

1. Merge and deploy `hotfix/v1.1.1-production-fixes` to align Railway + Vercel.
2. API health `version` field still reports `1.0.0` until backend redeploy with 1.1.1.
3. Dependency advisories deferred (see `DEPENDENCY_CLEANUP_REPORT.md`).
4. 23 orphan backend routes documented in API integrity check (intentional BFF-only paths).

---

## Recommendation

1. **Merge** hotfix PR to `main`.
2. **Deploy** Railway + Vercel.
3. **Re-run** smoke with `WILMS_EXPECTED_GIT_COMMIT` = merged SHA.
4. **Manual** UX pass on hotfix areas.
5. **Tag** `v1.1.1` after 32/32 + 11/11 on deployed commit.
