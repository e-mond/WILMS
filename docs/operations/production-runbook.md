# WILMS Production Runbook

**Version:** v1.3.6  
**Last updated:** 2026-07-12

## Pre-deploy checklist

- [ ] PR CI green (type-check, lint, unit tests, E2E)
- [ ] `CHANGELOG.md` and version bumped to target release
- [ ] Migration reviewed (`apps/backend/src/db/migrations/`)
- [ ] Neon backup or PITR confirmed
- [ ] Secrets verified in Railway + Vercel

## Deploy sequence

### 1. Database migration

```bash
npm install
npm run db:migrate -w @wilms/api
```

v1.3.6 requires through `0022_v135_notification_events.sql`.

### 2. API (Railway)

```bash
railway up --detach
curl -fsS https://wilms-production.up.railway.app/health
```

Expect `"version":"1.3.6"` and `"status":"ok"` (after migrations applied).

### 3. Frontend (Vercel)

```bash
vercel deploy --prod --yes
```

### 4. Post-deploy validation

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production -w @wilms/api

WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac -w @wilms/api

npm run verify:version
```

### 5. Manual workflow smoke (15 min)

| Workflow | Role | Pass criteria |
|----------|------|---------------|
| Login / logout | Any | Splash → Welcome Back → dashboard |
| Register borrower | Officer | 7-step wizard completes |
| Edit registration | Officer | `?edit=` loads without console errors |
| Approve application | Approver | Decision + export PDF |
| Record payment | Collector | Payment saved |
| Notification inbox | Any | Search, filter, mark read |
| Mobile capture | Officer | QR scan → photo on form |
| Forgot password | Public | Enumeration-safe success |

## Rollback

### Frontend (fast)

Vercel dashboard → Deployments → Promote previous production deployment.

### API

Railway → Deployments → Rollback to previous image, or redeploy prior git tag:

```bash
git checkout v1.3.4
railway up --detach
```

### Database

Do not roll back migrations in place without DBA review. Prefer Neon PITR to a branch, then swap connection string.

## Incident response

| Severity | Example | Response |
|----------|---------|----------|
| P1 | API 5xx, login broken | Rollback frontend + API; check `/health` |
| P2 | Email/SMS down | Verify `WILMS_VERCEL_MAIL_URL`, SMS keys; users can still use in-app |
| P3 | Export formatting | Non-blocking; patch on next release |
| P4 | RBAC smoke partial fail | Verify smoke credentials; check role seed users |

## Monitoring references

- [monitoring.md](./monitoring.md) — health probes, CI gates, log patterns
- [backups.md](./backups.md) — Neon, Cloudinary, config backup
- [../deployment-guide.md](../deployment-guide.md) — platform-specific deploy commands

## Release tagging

```bash
git tag -a v1.3.5 -m "WILMS v1.3.5"
git push origin v1.3.5
```

Publish GitHub Release from `RELEASE_NOTES_v1.3.5.md` after validation completes.
