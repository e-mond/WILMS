# RC1.2 — Testing

**Git SHA:** `e456febebf509d2672ea79741b6e9a59463de10d`  
**Date:** 2026-07-02T10:30:00Z  
**Branch:** `release/rc1-1-production-stabilization`  
**Commands run:**

```bash
npm run type-check
npm run lint
npm run verify:api-integrity
npm run verify:api-coverage
npm run verify:mock-guard
npm run test -w @wilms/api
npm run test -w @wilms/frontend
npm run build
npm run bundle:budget-check
WILMS_APP_URL=https://wilms.vercel.app WILMS_API_URL=https://wilms-production.up.railway.app npm run smoke:production
WILMS_APP_URL=https://wilms.vercel.app npm run smoke:rbac
```

**Result:** PASS (unit/integration/smoke); **PARTIAL** (E2E — see UI audit)

## Gate results

| Command | Expected | Actual | Exit |
|---------|----------|--------|------|
| `type-check` | 0 errors | PASS (frontend + api) | 0 |
| `lint` | 0 warnings | PASS | 0 |
| `verify:api-integrity` | 132/132 | **132/132** | 0 |
| `verify:api-coverage` | 0 placeholders | **0** | 0 |
| `verify:mock-guard` | PASS | PASS | 0 |
| `test -w @wilms/api` | 40 | **40/40** | 0 |
| `test -w @wilms/frontend` | 431 (2 shards) | **431** (217+214) | 0 |
| `build` | success | PASS (after clean `.next`) | 0 |
| `bundle:budget-check` | PASS | 168.5 KB gzip | 0 |
| `smoke:production` | 29 | **29/29** | 0 |
| `smoke:rbac` | 11 | **11/11** | 0 |
| `test:e2e` | green | **FAIL** (local `ENOSPC`) | 1 |

## Domain coverage map

| Domain | Representative tests |
|--------|---------------------|
| Auth / session | `apiClient.test.ts`, `session.test.ts`, `LoginForm.test.tsx` |
| RBAC | `collector-portal/rbac.test.ts`, `smoke:rbac` |
| Registration | `registration.schema.test.ts`, `BorrowerRegistrationWizard` tests |
| Payments / collections | `paymentService.*.test.ts`, reconciliation module tests |
| Approval | `PendingApplicationReview.test.tsx` |
| Offline sync | `offline-sync` module + frontend queue tests |
| Reports | `reportService` tests, reports hub smoke |
| Display IDs | `entity-display-id.test.ts` |

## Pass gate

All CI-gated commands exit 0 with expected counts. E2E documented as environmental failure — re-run before v1.0.0 tag.
