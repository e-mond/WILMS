# Final Release Summary — v1.3.7 Production Certification

**Date:** 2026-07-13  
**Stable tag:** [`v1.3.7`](https://github.com/e-mond/WILMS/releases/tag/v1.3.7)  
**Production certified tag:** **NOT ISSUED**

---

## Summary

WILMS v1.3.7 is **feature-complete and stable at the code level**. All local quality gates pass. Production hosts run v1.3.7, but the live database is **degraded** (pending migrations, missing schema tables), and authenticated smoke tests **fail** because production credentials are unavailable and demo accounts are disabled.

**The system is not ready for public go-live** until remediation steps below are completed and certification is re-run.

---

## What passed

| Area | Evidence |
|------|----------|
| Version alignment | 1.3.7 across root, frontend, backend, CHANGELOG |
| Type safety | `npm run type-check` |
| Lint | PASS (1 non-blocking warning) |
| Build | Production Next.js build |
| Bundle budget | 168.4 KB gzip JS |
| Unit tests | **366/366** (129 API + 237 frontend) |
| API integrity | Frontend client paths match backend routes |
| Mock guard | No forbidden mock imports |
| CSRF (prod) | Blocks login without token |
| Unauthenticated RBAC | API returns 401 |
| Financial model docs | `docs/financial-calculations.md` |

---

## What failed or is blocked

| Area | Issue |
|------|-------|
| `/health` | `status: degraded` — migrations + schema |
| Migrations | 23/24 applied; `0024`/`0025` not in journal (fixed in repo) |
| Schema | Missing `organization_holidays`, `loan_fee_charges`, `loan_penalty_rules` |
| Smoke tests | 14/33 — auth failures |
| RBAC smoke | 0/3 — login failures |
| Financial audit (live) | No DB / credentials |
| Backup & restore | No Neon access |
| DR drill | Not executed |
| Browser / mobile | No real devices |
| Accessibility | No axe/Lighthouse |
| Lighthouse CWV | Not run |
| E2E Playwright | Not run |

---

## Repository fix in this sprint

**Migration journal:** Added `0024_v137_rc3_pool_loan_linkage` and `0025_v137_rc3_pool_allocations_backfill` to `apps/backend/src/db/migrations/meta/_journal.json` so `drizzle-kit migrate` can apply v1.3.7 financial backfill on production.

---

## Operator actions (ordered)

1. Merge certification PR and deploy API if journal fix not yet on Railway.
2. `pg_dump` production database.
3. `npm run db:migrate -w @wilms/api` with production `DATABASE_URL`.
4. Confirm `/health` → `status: ok`, `migrations.applied: 26`, `schema.status: ok`.
5. Provide production smoke credentials; re-run `smoke:production` and `smoke:rbac`.
6. Execute [Go-Live Checklist](./GO_LIVE_CHECKLIST.md) manual items.
7. Run financial reconciliation audit on live data.
8. Complete browser/mobile/a11y/performance audits.
9. Execute backup restore drill.
10. Tag `v1.3.7-production-certified` and update GitHub Release.

---

## Deliverables

All thirteen reports are under [docs/certification/v1.3.7/](./INDEX.md).

---

## Recommendation

**Hold public go-live.** Proceed with migration remediation and authenticated validation. Re-run this certification sprint after `/health` is green and smoke tests pass 33/33.

**Signed:** Automated certification sprint — 2026-07-13
