# RC1.1 ÔÇö Deployment Report

**Date:** 2026-07-01  
**Status:** Pending PR merge to `main`

## Pre-merge verification (branch)

| Step | Command | Expected |
|------|---------|----------|
| Type check | `npm run type-check` | PASS |
| Lint | `npm run lint` | PASS |
| API gates | `verify:api-integrity`, `verify:api-coverage`, `verify:mock-guard` | PASS |
| Backend tests | `npm run test -w @wilms/api` | 40/40 |
| Frontend tests | `npm run test` | CI |
| Build | `npm run build` | PASS |

## Post-merge deploy (operator)

1. Merge PR ÔåÆ `main`
2. Railway: deploy API, run migrations if pending
3. Vercel: production deploy from `main`
4. `npm run smoke:production` (30+ checks with encoding probes)
5. `npm run smoke:rbac`

## Environment

- `NEXT_PUBLIC_API_BASE_URL=https://wilms.vercel.app/api/wilms`
- `WILMS_API_UPSTREAM=https://wilms-production.up.railway.app`
- `NEXT_PUBLIC_USE_MOCK=false`

## Do not auto-tag

`v1.0.0` tag requires stakeholder approval per `RC1.1-final-acceptance.md`.
