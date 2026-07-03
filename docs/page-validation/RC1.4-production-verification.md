# RC1.4 — Production Verification

**Status:** IN PROGRESS  
**Branch:** `release/rc1-4-v1-certification`

## Phase 1 — Deployment synchronization

| Check | Status | Evidence |
|-------|--------|----------|
| `verify:deploy-sync` script | Implemented | `scripts/verify-deploy-sync.mjs` |
| Platform SHA precedence | Implemented | `apps/backend/src/config/env.ts` |
| `buildId` = deployment ID only | Implemented | `health.service.ts` |
| Smoke gitCommit + schema gates | Implemented | `production-smoke.ts` |
| Deploy workflow RBAC + sync | Implemented | `.github/workflows/deploy-production.yml` |
| Remove stale `WILMS_GIT_COMMIT` | Pending | Railway dashboard |
| Railway/Vercel same commit live | Pending | Post-deploy curl |

## Phase 2 — Frontend page matrix

_Pending audit._

## Phase 11 — Super Admin E2E

_Pending verification._
