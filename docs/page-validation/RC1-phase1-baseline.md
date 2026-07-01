# RC1 Phase 1 — Verification Baseline

**Date:** 2026-07-01  
**Branch:** `release/rc1-production-finalization`  
**Base commit:** post hotfix PR #35 (`fix(ci): restore jest-dom vitest types without breaking next lint`)

## Hotfix verification (PR #35)

| Check | Result |
|-------|--------|
| `npm audit --audit-level=critical` | PASS (0 critical) |
| `npm run type-check` | PASS |
| `npm run lint` | PASS |
| `npm run build -w @wilms/frontend` | PASS |
| `npm run test -w @wilms/api` | PASS (16/16) |
| `npm run test -w @wilms/frontend` | PASS (206/206) |

## Production smoke (post-merge)

| Endpoint | Status |
|----------|--------|
| `GET https://wilms-production.up.railway.app/health` | 200 |
| `GET https://wilms.vercel.app` | 200 |

## CI changes (this branch)

- GitHub Actions `node-version` bumped from `20` → `22` in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (deprecation warning remediation)

## RC1 baseline suite (this branch)

| Check | Result |
|-------|--------|
| `npm run verify:api-integrity` | PASS — 112/112 frontend paths matched |
| `npm run bundle:budget-check` | PASS — JS 168.5 KB gzip / CSS 8.2 KB gzip |
| `npm run perf:budget-check` | PASS |
| Frontend `TODO/FIXME/HACK/console.log` in `src/features` | None found |
| Backend `TODO/FIXME` in `src/modules` | None found |

## Verdict

Baseline green. RC1 audit phases may proceed.
