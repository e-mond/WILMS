# RC1.1 ÔÇö API Coverage Report

**Generated:** 2026-07-01  
**Branch:** `release/rc1-1-production-stabilization`

## Automated gates

| Gate | Result |
|------|--------|
| `npm run verify:api-integrity` | **132/132** PASS |
| `npm run verify:api-coverage` | **0** placeholder hits PASS |
| `npm run verify:mock-guard` | **0** mock imports in `features/` PASS |

## Page inventory (46 routes)

All pages under `apps/frontend/src/app/**/page.tsx` route to feature panels using `apiDataProvider` in production (`index.production.ts`).

| Module | Pages | Service layer | Backend |
|--------|-------|---------------|---------|
| Super Admin | dashboard, borrowers, loans, groups, pools, collectors, risk, reports, settings, adjustments | `*Service.ts` ÔåÆ `apiClient` | Express modules |
| Approver | pending, pending/[id], reviewed | `approvalService.ts` | `borrowers`, `audit` |
| Collector | dashboard, payment, reconciliation, admin-fee, my-borrowers, expenses | `collectorService.ts`, `paymentService.ts` | `collector-portal`, `reconciliation` |
| Registration Officer | register, my-registrations | `registrationService.ts`, `uploadService.ts` | `registration`, `uploads` |
| Auditor | audit-log, reports | `auditService.ts`, `reportService.ts` | `audit`, `reports` |

## Mock isolation

- Production build aliases `@/services/index` ÔåÆ `index.production.ts`
- `features/**` has zero imports from `@/services/mock` (CI guard)
- `NEXT_PUBLIC_USE_MOCK=false` required in production

## Orphan backend routes (23)

Detail/read/validation endpoints consumed via dynamic paths ÔÇö documented in `RC1.1-api-matrix.md`.

## Verdict

**PASS** ÔÇö Every static `apiClient` path has a backend route; no placeholder UI; no mock leakage in features.
