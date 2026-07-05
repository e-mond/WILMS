# RC1 API Audit ÔÇö Frontend Ôåö Backend Contract

**Date:** 2026-07-01  
**Tool:** `npm run verify:api-integrity` (`scripts/rc1-api-integrity.mjs`)

## Summary

| Metric | Count |
|--------|-------|
| Frontend `apiClient` calls | 112 |
| Backend Express routes | 137 |
| Matched | **112** |
| Missing backend | **0** |
| Orphan backend routes | 29 (intentional ÔÇö see below) |
| Next.js pages | 46 |

**Verdict:** PASS ÔÇö all frontend API paths have backend routes.

## High-traffic routes verified in code

| Route | Backend module | Frontend consumer |
|-------|----------------|-------------------|
| `GET /settings/me` | `settings/routes.ts` | `settingsService.getSettingsMe()` |
| `GET /dashboard/summary` | `dashboard/routes.ts` | `dashboardService` |
| `GET /borrowers` | `borrowers/routes.ts` | `borrowerService` |
| `GET /groups` | `groups/routes.ts` | `groupService` |
| `GET /loan-pools` | `loan-pools/routes.ts` | `loanPoolService` |
| `GET /analytics/collection-metrics` | `analytics/routes.ts` | `collectionMetricsService` |

## BFF proxy chain

1. Browser ÔåÆ `NEXT_PUBLIC_API_BASE_URL` (normalized to `/api/wilms` in [`apps/frontend/src/config/api.ts`](../../apps/frontend/src/config/api.ts))
2. Next.js BFF ÔåÆ [`apps/frontend/src/app/api/wilms/[...path]/route.ts`](../../apps/frontend/src/app/api/wilms/[...path]/route.ts)
3. Railway API ÔåÆ Express routes in `apps/backend/src/modules/*/routes.ts`

## Orphan backend routes (29)

These are backend-only endpoints used by registration checks, detail pages, or admin workflows not wired through top-level service facades. Documented as intentional ÔÇö not production gaps.

Examples: `GET /borrowers/check-phone`, `GET /groups/:id`, `PATCH /loans/:id/approve`.

## Production data mode

- Production builds force `apiDataProvider` via webpack alias ([`apps/frontend/src/services/index.production.ts`](../../apps/frontend/src/services/index.production.ts))
- Mock provider isolated to `src/services/mock/` and dev/test aliases only
