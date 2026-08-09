# WILMS v1.8.0 — Engineering Certification Report

**Generated (UTC):** 2026-08-09T19:19:08Z → 2026-08-09T19:31:04Z (primary pipeline)  
**Branch tip / main:** `73e5b65d6a509b5c64f08f18e7266b59c72c0860`  
**Evidence dir:** `docs/v1.8.0/certification/evidence/`

## Verdict

**PASS WITH CONDITIONS**

Core automated gates (type-check, lint, domain tests, frontend Vitest shards) **PASS** with logged evidence.  
**Bundle budget** and a **fresh** Next.js artefact rebuild in this environment are **CONDITIONAL / BLOCKED** due to `next/font/google` failing to download Source Serif 4 from Google Fonts CDN (`ECONNRESET`), leaving `.next` without `BUILD_ID` / JS chunks.

## Pipeline summary (`evidence/pipeline-start.txt`)

| Gate | Exit | Evidence |
|------|------|----------|
| `npm run type-check` | **0** | `type-check.log` |
| `npm run lint` | **0** | `lint.log` |
| `npm run test -w @wilms/domain` | **0** | `domain-tests.log` — **82 files / 250 tests** |
| Frontend Vitest shard 1/2 | **0** | `frontend-shard1.log` — **95 files / 271 tests** |
| Frontend Vitest shard 2/2 | **0** | `frontend-shard2.log` — **94 files / 269 tests** |
| `npm run build -w @wilms/frontend` (pipeline) | **0** recorded | `build.log` incomplete (8 lines) — see Conditions |
| `verify:mock-guard` | **0** | `mock-guard.log` |
| `verify:api-integrity` | **0** | `api-integrity.log` |
| `bundle:budget-check` | **1** | `bundle-budget.log` — *No JS chunks found* |
| Fresh rebuild attempt | **CONDITIONAL** | `build-full.log` — Google Fonts `ECONNRESET` during serif CSS fetch |
| Bundle re-check | **1** | `bundle-budget-final.log` |

## Targeted financial / RBAC / SoD

`evidence/financial-rbac-sod.log` — **6 files / 26 tests PASS** (financial integrity P0, financial RBAC, SoD self-approve/review, collector + borrower RBAC).

## Accessibility e2e

`evidence/a11y-e2e.log` — **FAIL / BLOCKED**: Playwright Chromium executable missing + Google font fetch errors during webServer. **18 failed** (launch errors), not axe violations.

## Integration / route verification

- `verify:api-integrity` PASS (frontend apiClient paths matched).  
- `verify:mock-guard` PASS.  
- `verify:migrations` PASS (journal; watermark ok) — see Version Integrity report.

## Conditions

1. Re-run production `next build` on a network that can resolve `fonts.googleapis.com` / `fonts.gstatic.com` (or with warm Next font cache) and attach `BUILD_ID` + `bundle:budget-check` PASS.  
2. Install Playwright browsers (`npm run test:e2e:install`) before claiming a11y e2e.  
3. Prior successful builds on this workstation earlier the same day are **not** substituted as this pipeline’s complete `build.log` artefact.

## Timestamps

- CERT_START: `2026-08-09T19:19:08Z`  
- CERT_END (pipeline file): `2026-08-09T19:31:04Z`
