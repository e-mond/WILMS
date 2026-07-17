# Technical Debt Closure — Product Acceptance (v1.3.8)

**Phase:** 21  
**Date:** 17 July 2026  
**Prior review:** `docs/certification/v1.3.8/enterprise-excellence/TECHNICAL_DEBT_REVIEW.md`

---

## 1. Closure criteria (v1.3.8)

| Criterion | Target | Evidence | Status |
|-----------|--------|----------|--------|
| No `TODO` / `FIXME` / `HACK` in source | `apps/` + `packages/` | ripgrep July 2026: **0 matches** | ✅ Closed |
| `@deprecated` shims documented | Acceptable migration shims | 11 files (see §2) | ✅ Documented |
| Mock/demo blocked in production | Fail-fast | `mock-guard.ts`, `next.config.mjs` | ✅ Closed |
| Collector `MANAGE_GROUPS` SoD | Removed | `role-permissions.ts` | ✅ Closed |
| Dashboard client recompute in prod | Removed | `dashboardService.ts` API-only | ✅ Closed |
| IDOR fixes (v1.3.8) | Merged | `CHANGELOG.md` § Security | ✅ Closed |
| Ops observability | `/ops` + metrics | Phase 20 PR #126 | ✅ Closed |

---

## 2. Accepted `@deprecated` re-exports (not debt)

These are **intentional compatibility shims** — not open work items:

| File | Symbol | Replacement |
|------|--------|-------------|
| `apps/frontend/src/lib/auth/routes.ts` | portal home helper | `getPortalHomePath` from permission-matrix |
| `apps/frontend/src/features/export/engines/csv-engine.ts` | CSV helpers | `buildWilmsCsvContent` / `downloadWilmsCsv` |
| `apps/frontend/src/config/demo.ts` | demo config | `@/data-provider` |
| `apps/frontend/src/components/layout/shell/AsideSlotContext.tsx` | aside hooks | `useAsideContent` + `useAsideDispatch` |
| `apps/frontend/src/services/offlineSyncService.ts` | direct import | `@/services` barrel |
| `apps/backend/src/lib/ghana-locations.ts` | sync regions | `getGhanaRegions` async |
| `apps/backend/src/infrastructure/uploads/index.ts` | upload helpers | upload service |
| `apps/frontend/src/features/payment-collection/collector-dashboard.utils.ts` | assembler | mock service |
| `apps/frontend/src/features/export/utils/formatters.ts` | format helper | export framework |

**Action:** Remove shims in v1.4+ when downstream imports are migrated — tracked in `enterprise-excellence/ROADMAP_v1.4_v2.0.md`, not blocking v1.3.8.

---

## 3. Deferred items (explicitly not closed — roadmap)

| Item | Current state | Target |
|------|---------------|--------|
| In-process job queue | `ops/service.ts` `queue: 'in_process'` | v1.4 Redis + BullMQ |
| Statutory double-entry GL | Operational ledger only | v1.4+ per migration roadmap |
| Feature flag product | Env vars only | Future |
| 100k+ load proof | Not run | Pre-scale programme |
| Full WCAG audit | Component tests only | Dedicated a11y sprint |
| `@deprecated` shim removal | 11 files | v1.4 cleanup |

These are **accepted limitations**, not undocumented debt.

---

## 4. Test and quality debt

| Metric | Value | Path |
|--------|-------|------|
| Backend tests | 150 passed | `npm run test -w @wilms/api` |
| Frontend test files | 160+ | `apps/frontend/src/tests/` |
| Lint/type-check | Root scripts | `npm run lint`, `npm run type-check` |

**Residual:** Staging authenticated E2E smoke evidence — operational debt, not code debt.

---

## 5. Migration debt

| Item | Status |
|------|--------|
| Journal complete (28 entries) | ✅ In repo |
| `0027_hot_query_indexes` applied everywhere | ⚠ **Condition** |

---

## 6. Debt closure verdict

| Category | v1.3.7 | v1.3.8 |
|----------|--------|--------|
| Source markers (TODO/FIXME/HACK) | Unknown | **0** |
| Production mock leakage | Risk | **Blocked** |
| Financial SoT duplication | Partial | **Single builder** |
| RBAC SoD (collector groups) | Open | **Closed** |

**Technical debt for v1.3.8 release:** ✅ **Closed** for in-scope code quality.

Deferred platform items are **scheduled**, not hidden — see `LONG_TERM_MAINTENANCE_PLAN.md`.

**Maintainability score:** 84/100 — see [LAUNCH_READINESS_SCORECARD.md](./LAUNCH_READINESS_SCORECARD.md).
