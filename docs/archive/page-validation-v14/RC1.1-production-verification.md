# RC1.1 — Production Verification

**Date:** 2026-07-01  
**Branch:** `release/rc1-1-production-stabilization`

## Pre-merge gates

| Gate | Result |
|------|--------|
| `npm run type-check` | PASS |
| `npm run lint` | PASS |
| `npm run verify:api-integrity` | 132/132 PASS |
| `npm run verify:api-coverage` | 0 placeholders PASS |
| `npm run verify:mock-guard` | PASS |
| Backend tests | 40/40 PASS |
| Bundle budget | PASS |

## Production smoke (`npm run smoke:production`)

**Result:** 29/29 PASS (live)

Extended checks:
- BFF routes: borrowers, loans/portfolio
- Content-encoding: dashboard, borrowers, collectors (no `Content-Encoding` on JSON body)

## RBAC smoke (`npm run smoke:rbac`)

**Result:** 11/11 PASS (live)

- Admin: dashboard, settings/users, collectors → 200
- Collector: own dashboard, reconciliation → 200; admin routes → 403
- Officer: dashboard → 403

## Content decoding

Root cause fixed in `proxy-headers.ts`. Smoke asserts no encoding header mismatch.

## Chunk / stale bundle

- `error.tsx` ChunkLoadError recovery
- SW cache `wilms-shell-v2` + old cache purge on activate
- `ServiceWorkerRegistrar` reload on `controllerchange`
- `vercel.json` cache headers for static assets

## Manual checklist

- [ ] Registration upload (officer) — post-merge browser test
- [ ] Reports navigation — post-merge

## Verdict

**READY FOR PR** — Automated verification complete; deploy after merge approval.
