# WILMS Production Runbook

**Version:** v1.3.8  
**Last updated:** 2026-07-17

> **Full pack (authoritative for v1.3.8):** [docs/certification/v1.3.8/production-operations/](../certification/v1.3.8/production-operations/INDEX.md)
>
> - [DEPLOYMENT_RUNBOOK.md](../certification/v1.3.8/production-operations/DEPLOYMENT_RUNBOOK.md)
> - [ROLLBACK_RUNBOOK.md](../certification/v1.3.8/production-operations/ROLLBACK_RUNBOOK.md)
> - [GO_LIVE_CHECKLIST.md](../certification/v1.3.8/production-operations/GO_LIVE_CHECKLIST.md)
> - [INCIDENT_RESPONSE_PLAYBOOK.md](../certification/v1.3.8/production-operations/INCIDENT_RESPONSE_PLAYBOOK.md)

## Pre-deploy checklist

- [ ] PR CI green (type-check, lint, unit tests, E2E, budgets)
- [ ] `CHANGELOG.md` and version bumped to **1.3.8**
- [ ] Migration reviewed — through `0027_hot_query_indexes` (28 journal entries)
- [ ] Neon backup or PITR confirmed
- [ ] Secrets verified in Railway + Vercel + GitHub

## Deploy sequence

### 1. Database migration

```bash
npm install
npm run verify:migrations
npm run db:migrate -w @wilms/api
```

v1.3.8 requires through `0027_hot_query_indexes.sql` (28 migrations in journal).

Pre-migration backup:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=wilms-pre-migrate-$(date +%Y%m%d).dump
```

### 2. API (Railway)

**GitHub Actions (recommended):** Actions → Deploy Production → `confirm=deploy`

**Manual:**

```bash
railway up --detach
curl -fsS https://wilms-production.up.railway.app/health
```

Expect `"version":"1.3.8"`, `"status":"ok"`, `migrations.status: ok`, and `schema.status: ok`.

### 3. Frontend (Vercel)

```bash
vercel deploy --prod --yes
```

### 4. Post-deploy validation

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

### 5. Super Admin ops check

Login → **Operations** (`/ops`) → confirm surfaces and financial snapshot.

### 6. Manual workflow smoke (15 min)

| Workflow | Role | Pass criteria |
|----------|------|---------------|
| Login / logout | Any | Splash → Welcome Back → dashboard |
| Operations dashboard | Super Admin | `/ops` loads, refresh works |
| Register borrower | Officer | 7-step wizard completes |
| Edit registration | Officer | `?edit=` loads without console errors |
| Approve application | Approver | Decision + export PDF |
| Record payment | Collector | Payment saved |
| Notification inbox | Any | Search, filter, mark read |
| Mobile capture | Officer | QR scan → photo on form |
| Forgot password | Public | Enumeration-safe success |

## Rollback

See [ROLLBACK_RUNBOOK.md](../certification/v1.3.8/production-operations/ROLLBACK_RUNBOOK.md).

- **Frontend:** Vercel → Promote previous production deployment
- **API:** Railway → Rollback previous image or redeploy prior tag
- **Database:** Neon PITR — do not roll back migrations in place

## Incident response

See [INCIDENT_RESPONSE_PLAYBOOK.md](../certification/v1.3.8/production-operations/INCIDENT_RESPONSE_PLAYBOOK.md).

| Severity | Example | Response |
|----------|---------|----------|
| P1 | API 5xx, login broken | Rollback frontend + API; check `/health` |
| P2 | Email/SMS down | Verify `WILMS_VERCEL_MAIL_URL`, SMS keys; in-app still works |
| P3 | Export formatting | Non-blocking; patch on next release |
| P4 | RBAC smoke partial fail | Verify smoke credentials; check role seed users |

## Monitoring references

- [monitoring.md](./monitoring.md) — health, `/ops`, request IDs, metrics
- [backups.md](./backups.md) — Neon, Cloudinary, config backup
- [../deployment-guide.md](../deployment-guide.md) — platform-specific deploy commands
- [../certification/v1.3.8/production-operations/](../certification/v1.3.8/production-operations/INDEX.md) — full ops pack

## Release tagging

```bash
git tag -a v1.3.8 -m "WILMS v1.3.8"
git push origin v1.3.8
```

Publish GitHub Release after [GO_LIVE_CHECKLIST.md](../certification/v1.3.8/production-operations/GO_LIVE_CHECKLIST.md) validation completes.
