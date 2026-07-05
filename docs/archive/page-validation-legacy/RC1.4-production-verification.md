# RC1.4 ÔÇö Production Verification

**Status:** IN PROGRESS
**Branch:** `release/rc1-4-v1-certification`

## Phase 1 ÔÇö Deployment synchronization

| Check | Status | Evidence |
|-------|--------|----------|
| `verify:deploy-sync` script | Implemented | `scripts/verify-deploy-sync.mjs` |
| Platform SHA precedence | Implemented | `apps/backend/src/config/env.ts` (`resolveGitCommit`) |
| `buildId` = deployment ID only | Implemented | `health.service.ts` |
| Smoke gitCommit + schema gates | Implemented | `production-smoke.ts` (31/31 live) |
| Deploy workflow RBAC + sync | Implemented | `.github/workflows/deploy-production.yml` |
| Dockerfile fallback documented | Implemented | `Dockerfile` |
| Remove stale `WILMS_GIT_COMMIT` | Ops ÔÇö pending | Railway dashboard |
| Railway/Vercel same commit live | Ops ÔÇö pending | Post-deploy curl |

### Live smoke evidence (2026-07-03)

```
npm run smoke:production  ÔåÆ  Passed: 31/31
/health ÔåÆ gitCommit=4e0b10a, schema.status=ok, migrations 11/11
```

### Railway operator steps (manual)

1. Remove the hardcoded `WILMS_GIT_COMMIT` service variable. `env.ts` now prefers
   `RAILWAY_GIT_COMMIT_SHA`, so the live commit is reported automatically after redeploy.
2. Confirm `DATABASE_URL` points at the repaired Neon DB (39 public tables, 11 migrations).
3. Confirm `CLOUDINARY_*` variables match the production folder.
4. Redeploy Railway + Vercel from the release branch HEAD, then run:
   ```bash
   EXPECTED_GIT_COMMIT=$(git rev-parse HEAD) WILMS_API_URL=https://wilms-production.up.railway.app npm run verify:deploy-sync
   ```

## Phase 2 ÔÇö Frontend page matrix

Routed pages under `apps/frontend/src/app/` (46 `page.tsx`). Empty-DB behaviour is
guarded by `QueryStatePanel` + `empty-state-copy.ts` (RC1.3). BFF proxy + encoding
paths verified green by production smoke (dashboard, borrowers, collectors, loans,
groups, pools, risk-flags, messages, reports, portfolio ÔÇö all 200, brotli JSON ok).

| Area | Verification |
|------|--------------|
| BFF proxy routes | smoke 200 (dashboard/borrowers/collectors/loans/groups/pools/risk-flags/messages/reports) |
| Content-encoding | smoke brotli JSON ok (dashboard/borrowers/collectors) |
| Empty-DB panels | `useQueryLoadingPolicy` + `QueryStatePanel` |
| E2E page coverage | `apps/frontend/e2e/rc1-functional-audit.spec.ts` |

## Phase 11 ÔÇö Super Admin verification

| Flow | Status |
|------|--------|
| User invite | RBAC smoke `admin-settings-users` 200 |
| Role/permission changes | RBAC smoke 11/11 |
| Activation/suspension | Settings service `PATCH` |
| Registration completion | Phase 3 draft submit |
