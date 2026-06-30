# RC1 — API Integrity

**Gate:** GATE 2  
**Date:** 2026-06-30

---

## Static matrix

```bash
npm run verify:api-integrity
```

| Metric | Result |
|--------|--------|
| Frontend `apiClient` calls | 107 |
| Backend routes | 132 |
| Matched | 107 |
| Missing backend | **0** |
| Next.js pages | 46 |

---

## Orphan backend routes (intentional)

29 backend routes have no direct `apiClient` call in `services/` — these are consumed via:

- Dynamic path segments (`/loans/:id`, `/borrowers/:id`)
- Mutation hooks calling parameterized paths
- BFF auth routes (`/auth/*`)

Documented orphans include detail/read endpoints: `GET /loans/:id`, `GET /groups/:id`, `GET /collectors/:id`, payment reversal, reconciliation sub-routes.

---

## Orphan pages / dead nav

- All `SUPER_ADMIN_NAV`, `APPROVER_NAV`, `COLLECTOR_NAV`, `REGISTRATION_OFFICER_NAV` entries resolve to `apps/frontend/src/app/**/page.tsx`
- No dead navigation links identified in static crawl

---

## Production mock guard

`NEXT_PUBLIC_USE_MOCK_SERVICES` must be `false` in production. Service factory in `apps/frontend/src/services/index.ts` selects live implementations when unset/false.

---

## Tooling

| Script | Purpose |
|--------|---------|
| `scripts/rc1-api-integrity.mjs` | Static match + orphan detection |
| `scripts/p14-6-4-api-matrix.mjs` | Legacy P14.6.4 matrix (superseded) |

---

**Verdict:** PASS — all frontend service API calls have backend routes.
