# RC1.1 ÔÇö Testing Report

**Date:** 2026-07-01  
**Branch:** `release/rc1-1-production-stabilization`

## Automated suite

| Suite | Count | Status |
|-------|-------|--------|
| Backend unit (`@wilms/api`) | **40/40** | PASS |
| Frontend unit (`@wilms/frontend`) | **431** (217 + 214, 2 shards) | PASS |
| API integrity | **132/132** | PASS |
| API coverage placeholders | **0** | PASS |
| Mock import guard | **0** violations | PASS |
| Bundle budget | JS 168.5 KB gzip | PASS |
| Type check | frontend + api | PASS |
| Lint | frontend | PASS |

## Production smoke

| Script | Checks |
|--------|--------|
| `smoke:production` | 30+ (health, CSRF, BFF routes, content-encoding probes) |
| `smoke:rbac` | 11 role-scoped probes |

## E2E (local, not CI-gated)

- 14 Playwright specs under `apps/frontend/e2e/`
- `rc1-functional-audit.spec.ts` ÔÇö decoding + navigation guards

## Categories covered

| Category | Coverage |
|----------|----------|
| RBAC | `collector-portal/rbac.test.ts`, `smoke:rbac` |
| Session / CSRF | `apiClient.test.ts`, `session.test.ts`, production smoke |
| Approval workflow | `PendingApplicationReview.test.tsx` |
| Payments | `paymentService.mock.test.ts`, `paymentService.entry.test.ts` |
| Registration | `registration.schema.test.ts`, `BorrowerRegistrationWizard` tests |
| Display IDs | `entity-display-id.test.ts` |

## Verdict

**PASS** ÔÇö CI gates green; production smoke extended for RC1.1.
