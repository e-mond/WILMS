# Go-Live Checklist — v1.3.7

**Date:** 2026-07-13  
**Status:** **OPEN** — not ready for public deployment

---

## Pre-deploy

- [x] PR CI green on `main` @ v1.3.7
- [x] Version consistency (`verify:version` → 1.3.7)
- [x] Unit tests (129 backend + 237 frontend)
- [x] Production build + bundle budget
- [ ] E2E Playwright suite
- [ ] Neon backup / PITR confirmed
- [ ] Railway + Vercel secrets audited

## Database

- [ ] `pg_dump` pre-migration backup
- [ ] Register migrations through `0026` in journal (remediation branch)
- [ ] `npm run verify:migrations` — journal integrity PASS
- [ ] `npm run db:migrate -w @wilms/api` on production
- [ ] `/health` → `migrations.status: ok` (applied = expected = 27)
- [ ] `/health` → `schema.status: ok` (no missing tables)
- [ ] Verify indexes / FKs on `pool_allocations`, `financial_reconciliations`

## Deploy

- [x] API deployed — v1.3.7 on Railway (`gitCommit` 7b3bdb27…)
- [x] Frontend deployed — https://wilms.vercel.app (login HTTP 200)
- [ ] Confirm `WILMS_API_UPSTREAM` points to Railway production
- [ ] Confirm `NEXT_PUBLIC_USE_MOCK=false`

## Post-deploy automated

- [ ] `smoke:production` — 33/33 with `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD`
- [ ] `smoke:rbac` — all role checks
- [ ] `verify:deploy-sync` (if configured)

## Authentication smoke

- [ ] Login / logout
- [ ] Remember me
- [ ] Password reset (enumeration-safe)
- [ ] MFA (if enabled)
- [ ] Session expiry
- [ ] App lock

## Registration

- [ ] 7-step borrower registration
- [ ] Validation + uploads
- [ ] Approval workflow
- [ ] Edit registration (`?edit=`)

## Loan workflow

- [ ] Pool creation
- [ ] Borrower registration
- [ ] Loan creation → approval → disbursement
- [ ] Collection → reconciliation → completion

## Financial integrity

- [ ] Pool KPIs non-zero where data exists
- [ ] Dashboard totals match reports
- [ ] Expenses deduct from operating cash
- [ ] Exports (CSV/Excel/PDF) match UI

## Messaging & notifications

- [ ] Super Admin → Collector message
- [ ] Reply + notification + read + history
- [ ] Browser / in-app / badge / deep links

## RBAC

- [ ] Super Admin — full access
- [ ] Admin — restricted admin
- [ ] Collector — own scope only; blocked from global config
- [ ] Registration officer — registration only
- [ ] Approver — approval only
- [ ] Auditor — read-only
- [ ] Unauthorized routes return 403/401

## Non-functional

- [ ] Browser matrix (Chrome, Edge, Firefox, Safari)
- [ ] Mobile devices (Android + iOS)
- [ ] WCAG 2.2 AA axe audit
- [ ] Lighthouse performance on production
- [ ] Backup restore drill
- [ ] DR simulation documented with RPO/RTO

## Release

- [ ] Update GitHub Release with **Production Certified**
- [ ] Tag `v1.3.7-production-certified` or `v1.3.7+prod`
- [ ] Announce go-live to stakeholders

---

**Sign-off required:** Engineering, QA, Security, DevOps, Product — all unchecked.
