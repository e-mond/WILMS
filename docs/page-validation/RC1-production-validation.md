# RC1 — Production Validation

**Gate:** GATE 5  
**Date:** 2026-06-30

---

## Command matrix

| Command | Result |
|---------|--------|
| `npm run type-check` | PASS |
| `npm run build` | PASS |
| `npm run test` (frontend) | PASS (203+) |
| `npm run test -w @wilms/api` | PASS (16/16) |
| `npm run verify:api-integrity` | PASS (107/107) |
| `npm run verify:version` | Run post-deploy |
| `npm run smoke:production` | Run post-deploy |
| `npm run test:e2e` | Run in CI / staging |

---

## Backend tests added

`apps/backend/src/tests/reports/domain.test.ts` — 4 report domain tests

## Frontend tests added

`apps/frontend/src/tests/lib/api-proxy-headers.test.ts` — 2 proxy header tests

---

## Deploy targets

| Service | Action |
|---------|--------|
| Vercel | BFF proxy fix + frontend RC1 |
| Railway | Report domain implementations |

---

**Verdict:** Local acceptance matrix PASS. Production smoke pending deploy.
