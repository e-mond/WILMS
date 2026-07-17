# Deployment Runbook — WILMS v1.3.8

**Version:** 1.3.8  
**Last updated:** 2026-07-17  
**Platforms:** Vercel (frontend) · Railway (API) · Neon (PostgreSQL)

## 1. Overview

WILMS deploys from the **monorepo root**. Never deploy `apps/backend/` or `apps/frontend/` in isolation — workspace packages are required at build time.

| Component | Platform | Config |
|-----------|----------|--------|
| Frontend | Vercel | `vercel.json` (root) |
| API | Railway | `Dockerfile`, `railway.toml` |
| Database | Neon | Drizzle migrations via `npm run db:migrate -w @wilms/api` |

**Production URLs:**

- Frontend: https://wilms.vercel.app
- API: https://wilms-production.up.railway.app

## 2. Pre-deploy checklist

- [ ] Target release merged to `main`; `package.json` version = **1.3.8**
- [ ] `CHANGELOG.md` updated
- [ ] PR CI green (see [SYSTEM_MONITORING_GUIDE.md](./SYSTEM_MONITORING_GUIDE.md) § CI gates)
- [ ] Migrations reviewed — v1.3.8 requires through **`0027_hot_query_indexes`** (28 journal entries)
- [ ] `npm run verify:migrations` passes locally
- [ ] Neon PITR enabled; pre-migration backup scheduled
- [ ] Railway + Vercel + GitHub secrets audited
- [ ] Staging deploy validated (if `ENABLE_STAGING_DEPLOY=true`)

## 3. Deploy methods

### 3.1 Recommended — GitHub Actions (production)

Workflow: [`.github/workflows/deploy-production.yml`](../../../../.github/workflows/deploy-production.yml)

1. GitHub → Actions → **Deploy Production**
2. Run workflow → input `confirm` = **`deploy`**
3. Workflow sequence:
   - Baseline health curl
   - `npm run db:migrate -w @wilms/api` (production `DATABASE_URL`)
   - Railway API deploy
   - Vercel production deploy
   - Verify: health, version consistency, deploy sync, `smoke:production`, `smoke:rbac`

**Concurrency:** `deploy-production` group; does not cancel in-progress deploys.

### 3.2 Manual deploy (break-glass)

Use when GitHub Actions is unavailable. Order matters: **migrate → API → frontend**.

#### Step 1 — Pre-migration backup

```bash
pg_dump "$DATABASE_URL" --format=custom --file=wilms-pre-migrate-$(date +%Y%m%d).dump
```

#### Step 2 — Database migration

```bash
npm ci
npm run verify:migrations
npm run db:migrate -w @wilms/api
```

Confirm journal includes `0027_hot_query_indexes`:

```bash
# 28 entries in apps/backend/src/db/migrations/meta/_journal.json
```

#### Step 3 — API (Railway)

```bash
railway up --detach
```

Verify:

```bash
curl -fsS https://wilms-production.up.railway.app/health | jq .
```

Expect:

- `"version": "1.3.8"`
- `"status": "ok"`
- `migrations.status: "ok"` (watermark ≥ latest journal `when`)
- `schema.status: "ok"`

Railway health check: `railway.toml` → `healthcheckPath = "/health"`, timeout 120s.

#### Step 4 — Frontend (Vercel)

```bash
vercel deploy --prod --yes
```

Post-deploy: collectors should hard-refresh or reinstall PWA for service worker updates.

#### Step 5 — Post-deploy validation

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
WILMS_SMOKE_EMAIL=<production-admin> \
WILMS_SMOKE_PASSWORD=<secret> \
npm run smoke:production -w @wilms/api

WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac -w @wilms/api

npm run verify:version
npm run verify:deploy-sync
```

#### Step 6 — Super Admin ops check

1. Login as Super Admin
2. Navigate to **Operations** (`/ops`)
3. Confirm deployment version, health surfaces, financial snapshot load

## 4. Required production environment

### Railway (API)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon connection string |
| `WILMS_SESSION_SECRET` | Yes | Session HMAC |
| `WILMS_CORS_ORIGIN` | Yes | `https://wilms.vercel.app` |
| `UPLOAD_PROVIDER` | Yes | `cloudinary` |
| `CLOUDINARY_*` | Yes | Cloud name, key, secret |
| `SMS_PROVIDER` | Yes | `smsnotifygh` (default prod) |
| `SMSNOTIFYGH_*` | Yes | API key, sender ID |
| `MAIL_PROVIDER` | Yes | `gmail` or `resend` |
| `WILMS_VERCEL_MAIL_URL` | If Gmail | Origin only, e.g. `https://wilms.vercel.app` |
| `WILMS_INTERNAL_MAIL_SECRET` | If Gmail relay | Must match Vercel |
| `WILMS_METRICS_TOKEN` | Recommended | Prometheus scrape auth |
| `WILMS_APP_URL` | Yes | QR/capture links |

### Vercel (frontend)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `/api/wilms` |
| `NEXT_PUBLIC_USE_MOCK` | Yes | `false` |
| `WILMS_API_UPSTREAM` | Yes | Railway API URL |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | If Gmail relay | Vercel SMTP |
| `WILMS_INTERNAL_MAIL_SECRET` | If Gmail relay | Must match Railway |

Full list: [docs/deployment-guide.md](../../../deployment-guide.md).

## 5. Staging deploy

Workflow: [`.github/workflows/deploy-staging.yml`](../../../../.github/workflows/deploy-staging.yml)

- Triggers on successful CI on `main` when `ENABLE_STAGING_DEPLOY=true`
- Uses `STAGING_DATABASE_URL`, `RAILWAY_STAGING_SERVICE_ID`
- Vercel preview (not production domain)

```bash
npm run smoke:staging -w @wilms/api
```

## 6. Migration notes — v1.3.8

| Migration | Purpose |
|-----------|---------|
| `0026_v137_prod_schema_repair` | Production schema repair |
| `0027_hot_query_indexes` | Indexes on `payments(collector_user_id, payment_date)`, `ledger_entries(loan_id)`, `payments(loan_id)` |

**Health gate:** If `migrations.status` is `degraded` with reason `migrations_behind`, re-run `db:migrate`. Drizzle uses journal watermark (`when`), not raw row count.

## 7. Manual workflow smoke (15 min)

| Workflow | Role | Pass criteria |
|----------|------|---------------|
| Login / logout | Any | Splash → dashboard |
| Operations dashboard | Super Admin | `/ops` surfaces load |
| Register borrower | Officer | 7-step wizard completes |
| Approve application | Approver | Decision + export PDF |
| Record payment | Collector | Payment saved, GPS if enabled |
| Notification inbox | Any | Search, filter, mark read |
| Mobile capture | Officer | QR scan → photo on form |
| Forgot password | Public | Enumeration-safe response |

## 8. Release tagging

```bash
git tag -a v1.3.8 -m "WILMS v1.3.8"
git push origin v1.3.8
```

Publish GitHub Release from release notes after validation.

## 9. Rollback reference

If deploy fails validation, see [ROLLBACK_RUNBOOK.md](./ROLLBACK_RUNBOOK.md). Do not leave production on a failed migration without DBA review.

## 10. Related docs

- [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)
- [docs/operations/production-runbook.md](../../../operations/production-runbook.md) — short summary
