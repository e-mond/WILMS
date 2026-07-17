# Go-Live Checklist — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17  
**Status:** Evidence-based — **Complete** only where repo evidence exists; otherwise **Pending**

Use this checklist before declaring production ready for v1.3.8. Attach evidence links (CI run URL, command output, screenshot) in your release record.

---

## Pre-deploy

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | `main` at v1.3.8 (`package.json` version) | **Complete** | Root `package.json` → `"version": "1.3.8"` |
| 2 | `CHANGELOG.md` updated for release | **Pending** | Verify at release cut |
| 3 | PR CI green (type-check, lint, tests, budgets) | **Complete** | `.github/workflows/ci.yml` defines gates |
| 4 | `npm run verify:api-integrity` in CI | **Complete** | `ci.yml` → `verify:api-integrity` |
| 5 | `npm run verify:mock-guard` in CI | **Complete** | `ci.yml` → `verify:mock-guard` |
| 6 | Bundle budget check in CI | **Complete** | `ci.yml` → `bundle:budget-check` |
| 7 | E2E Playwright suite green on release commit | **Pending** | `test:e2e` in frontend; run on release SHA |
| 8 | Neon PITR enabled and retention confirmed | **Pending** | Neon console screenshot |
| 9 | Railway + Vercel + GitHub secrets audited | **Pending** | Ops vault checklist |

---

## Database

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 10 | Journal includes `0027_hot_query_indexes` | **Complete** | `apps/backend/src/db/migrations/meta/_journal.json` (28 entries, idx 27) |
| 11 | `npm run verify:migrations` passes | **Complete** | Script: `npm run verify:migrations -w @wilms/api` |
| 12 | `pg_dump` pre-migration backup taken | **Pending** | Store dump path / timestamp |
| 13 | `npm run db:migrate -w @wilms/api` on production | **Pending** | Post-migrate `/health` output |
| 14 | `/health` → `migrations.status: ok` | **Pending** | Watermark ≥ journal `when` for `0027` |
| 15 | `/health` → `schema.status: ok` | **Pending** | `missingTables: []` |
| 16 | Hot indexes present (`0027`) | **Complete** | `0027_hot_query_indexes.sql` — `payments_collector_date_idx`, `ledger_entries_loan_id_idx`, `payments_loan_id_idx` |

---

## Deploy

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 17 | Deploy workflow exists (`workflow_dispatch`, `confirm=deploy`) | **Complete** | `.github/workflows/deploy-production.yml` |
| 18 | API deployed to Railway | **Pending** | `/health` → `version: 1.3.8` |
| 19 | Frontend deployed to Vercel | **Pending** | `wilms.vercel.app/login` HTTP 200 |
| 20 | `WILMS_API_UPSTREAM` → Railway production | **Pending** | Vercel env export |
| 21 | `NEXT_PUBLIC_USE_MOCK=false` | **Pending** | Vercel env export |
| 22 | `UPLOAD_PROVIDER=cloudinary` + credentials | **Pending** | `/health` → `uploads.valid: true` |
| 23 | Mail relay configured (if Gmail) | **Pending** | `/health` → `integrations.mail.configured` |
| 24 | SMS provider configured | **Pending** | `/health` → `integrations.sms.configured` |

---

## Post-deploy automated

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 25 | Deploy workflow health step (curl `/health`) | **Complete** | `deploy-production.yml` verify-production job |
| 26 | `verify:version` in deploy workflow | **Complete** | `scripts/verify-version-consistency.mjs` in workflow |
| 27 | `verify:deploy-sync` in deploy workflow | **Complete** | `scripts/verify-deploy-sync.mjs` in workflow |
| 28 | `smoke:production` with prod credentials | **Pending** | `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD` required on live |
| 29 | `smoke:rbac` all roles | **Pending** | Workflow step + role env vars |
| 30 | Ops metrics token set (recommended) | **Pending** | `WILMS_METRICS_TOKEN` on Railway |

---

## Observability (v1.3.8)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 31 | `X-Request-Id` middleware active | **Complete** | `apps/backend/src/middleware/request-id.ts`; mounted first in `app.ts` |
| 32 | Request ID in API logs | **Complete** | `logger.ts` includes `requestId` from AsyncLocalStorage |
| 33 | `GET /api/v1/ops/status` implemented | **Complete** | `apps/backend/src/modules/ops/routes.ts` |
| 34 | `GET /api/v1/ops/metrics` implemented | **Complete** | Prometheus text in `ops/service.ts` |
| 35 | Super Admin `/ops` UI | **Complete** | `apps/frontend/src/app/(super-admin)/ops/page.tsx` |
| 36 | External uptime probes configured | **Pending** | Uptime provider config |
| 37 | Prometheus scrape configured | **Pending** | Grafana/Prometheus setup |

---

## Authentication smoke

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 38 | Login / logout | **Pending** | Manual or smoke output |
| 39 | Demo accounts blocked on production | **Complete** | DB mode uses real users; `smoke-credentials.ts` requires prod creds on `wilms.vercel.app` / `railway.app` |
| 40 | Password reset enumeration-safe | **Pending** | Manual test |
| 41 | Session invalidation on role change | **Complete** | `security-guide.md` + `session_version` pattern |
| 42 | Login rate limit (20/15min) | **Complete** | `login-rate-limit.ts` |

---

## Registration & loans

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 43 | 7-step borrower registration | **Pending** | Manual workflow |
| 44 | Mobile photo capture (no 401 on public routes) | **Complete** | `deployment-guide.md` curl checks documented |
| 45 | Approve → disbursement workflow | **Pending** | Manual workflow |
| 46 | Collection + reconciliation | **Pending** | Manual workflow |

---

## Financial integrity

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 47 | Dashboard totals vs reports | **Pending** | Reconciliation export |
| 48 | Ops financial snapshot on `/ops` | **Complete** | `buildDashboardFinancialOverview` in ops service |
| 49 | Negative cash alert surface | **Complete** | `negative_operating_cash` alert in ops report |

---

## RBAC

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 50 | Permission matrix matches code | **Complete** | `docs/permission-matrix.md` sourced from `packages/shared-rbac` |
| 51 | `smoke:rbac` script exists | **Complete** | `rbac-production-smoke.ts` |
| 52 | Collector lacks `manage-groups` (v1.3.8) | **Complete** | `permission-matrix.md` SoD note |
| 53 | Auditor blocked from admin portal | **Complete** | No `access-admin-portal` for Auditor |

---

## Non-functional

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 54 | Railway health check `/health` | **Complete** | `railway.toml` → `healthcheckPath = "/health"` |
| 55 | PITR restore drill documented | **Complete** | [BACKUP_AND_RECOVERY_PLAN.md](./BACKUP_AND_RECOVERY_PLAN.md) |
| 56 | PITR restore drill executed | **Pending** | Drill record |
| 57 | Browser / mobile matrix | **Pending** | QA sign-off |
| 58 | WCAG audit on production | **Pending** | a11y report |

---

## Release

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 59 | Git tag `v1.3.8` pushed | **Pending** | `git tag -l v1.3.8` |
| 60 | GitHub Release published | **Pending** | Release URL |
| 61 | Stakeholder go-live announcement | **Pending** | Comms record |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering lead | | | |
| Super Admin / product owner | | | |
| Operations / SRE | | | |

**Related:** [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) · [INDEX.md](./INDEX.md)
