# RC1.1 — API Matrix

**Date:** 2026-07-01  
**Branch:** `release/rc1-production-final`  
**Base:** post hotfix `8e0df23` (production router RBAC + collector portal)

---

## Static integrity

```bash
npm run verify:api-integrity
npm run verify:api-coverage
```

| Metric | Result |
|--------|--------|
| Frontend `apiClient` paths | 132 |
| Backend routes | 148 |
| Matched | **132/132** |
| Missing backend | **0** |
| Orphan backend routes | 23 (detail/read/param routes — documented below) |
| Next.js pages | 46 |
| Placeholder UI hits | **0** |

---

## Hotfix-affected routes

| Route | Role | Expected | Post-hotfix |
|-------|------|----------|-------------|
| `GET /collector/:id/dashboard` | COLLECTOR (self) | 200 | **200** |
| `GET /collector/:id/dashboard` | REGISTRATION_OFFICER | 403 | **403** |
| `GET /notifications/inbox/unread-count` | COLLECTOR | 200 | **200** |
| `POST /registration/capture-sessions` | COLLECTOR | 201 | **201** (CAPTURE_DOCUMENTS) |
| `POST /uploads` | COLLECTOR | 201 | **201** (CSRF + CAPTURE_DOCUMENTS) |
| `GET /borrowers/:id/disbursement-eligibility` | COLLECTOR | 403 | **403** (approver-only) |
| `GET /reconciliation` | COLLECTOR | 200 | **200** |

Root cause fixed: router-level `requirePermission` on early-mounted routers blocked unrelated paths for collectors. Permissions moved to per-route guards.

---

## Collector portal pages (production)

| Page | Primary API | Mock in prod |
|------|-------------|--------------|
| `/collector/dashboard` | `GET /collector/:id/dashboard` | No |
| `/collector/my-borrowers` | `GET /collector/:id/borrowers` | No |
| `/collector/admin-fee` | `GET /admin-fee/status` | No |
| `/collector/reconciliation` | `GET /reconciliation` | No |
| `/collector/payment/[id]` | `POST /payments` | No |

Service factory: `index.production.ts` → `ApiDataProvider` only.

---

## Orphan backend routes (intentional)

Detail and validation endpoints without a static `apiClient` string:

- `GET /loans/:id`, `GET /groups/:id`, `GET /collectors/:id`, `GET /loan-pools/:id`
- Borrower duplicate-check routes (`check-phone`, `check-id`, etc.)
- Location hierarchy (`/locations/regions/*`)
- `GET /messages/threads/:id`, `GET /reconciliations/:id`
- `GET /reports/daily-collection`, `GET /adjustments/:id`

---

## Verdict

**PASS** — API matrix green; collector portal wired to live backend; zero placeholder pages.
