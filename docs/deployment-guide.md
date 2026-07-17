# WILMS Deployment Guide

**Last updated:** 2026-07-17 (v1.3.8)

## Runtime versions

| Surface | Node version |
|---------|----------------|
| Local / CI type-check & tests | Node **22** (see root engines / CI) |
| API Docker image / some deploy workflows | Historically Node **20** — **unify on Node 22 in v1.4** (Phase 17 DO-01) |

Prefer matching local Node to CI (22) when developing.

## Deployment model

| Component | Platform | Deploy from |
|-----------|----------|-------------|
| Frontend | Vercel | repository root (`vercel.json`) |
| API | Railway | repository root (`Dockerfile`, `railway.toml`) |
| Database | Neon PostgreSQL | Drizzle migrations from `apps/backend` |
| Uploads | Cloudinary | Railway production env |

Always deploy from the monorepo root. Do not deploy `apps/backend/` in isolation because the API depends on workspace packages.

## Database migrations

Run before or during API deploy:

```bash
npm run db:migrate -w @wilms/api
```

Recent migrations:

| Tag | Release | Purpose |
|-----|---------|---------|
| `0019_v123_platform_stabilization` | v1.2.3 | Invitation lifecycle timestamps, audit enums |
| `0020_v130_field_operations` | v1.3.0 | Repayment cadence, holidays, fees, penalties |
| `0022_v135_notification_events` | v1.3.5 | Password changed, invitation accepted, login alert notification events |

**Health check:** After migrate, `GET /health` must return `"status":"ok"`. If `"status":"degraded"`, inspect `degradedReasons` — commonly `migrations_behind` or `schema_missing_tables` from unapplied `0020`/`0022`.

See also: [Production runbook](operations/production-runbook.md), [Monitoring](operations/monitoring.md), [Backups](operations/backups.md).

## API deploy

```bash
railway up --detach
```

Verify:

```bash
curl -fsS https://wilms-production.up.railway.app/health
npm run verify:deploy-sync
```

## Frontend deploy

```bash
vercel deploy --prod --yes
```

Production domain: https://wilms.vercel.app

After deploy, collectors should hard-refresh or reinstall the PWA to pick up the latest service worker cache.

## Required production secrets

See `.env.example` for the full reference. Production must include:

- `DATABASE_URL`
- `WILMS_SESSION_SECRET`
- `WILMS_CORS_ORIGIN`
- `WILMS_API_UPSTREAM`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_USE_MOCK=false`
- `UPLOAD_PROVIDER=cloudinary`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMS_PROVIDER=smsnotifygh`
- `SMSNOTIFYGH_API_KEY`
- `SMSNOTIFYGH_SENDER_ID`
- `WILMS_VERCEL_MAIL_URL` (origin only, no `/api/mail` suffix)
- `WILMS_INTERNAL_MAIL_SECRET`

## Post-deploy validation

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production

WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac
```

### Mobile photo capture (v1.3.4+)

Verify public capture routes are reachable without authentication:

```bash
# Must return 404 or 503 — never 401
curl -sS -o /dev/null -w "lookup:%{http_code}\n" \
  "${WILMS_APP_URL}/api/wilms/photo-capture/sessions/pcs_invalid00000001"

# Must not return 401 or 403 (CSRF) — expect 404, 422, or 503
curl -sS -o /dev/null -w "upload:%{http_code}\n" -X POST \
  "${WILMS_APP_URL}/api/wilms/photo-capture/sessions/pcs_invalid00000001/upload" \
  -H "content-type: application/json" \
  -d '{"purpose":"borrower-photo","fileName":"t.jpg","mimeType":"image/jpeg","sizeBytes":16,"dataUrl":"data:image/jpeg;base64,/9j/4AAQ"}'
```

Then perform a manual end-to-end test: officer generates QR on desktop → mobile scans → capture → desktop form updates.

Required env for capture:

| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Railway | Session persistence |
| `WILMS_APP_URL` | Railway | QR link domain |
| `WILMS_API_UPSTREAM` | Vercel | BFF → API proxy |

### v1.3.0 field checks

1. Collector Settings → Device — confirm battery and storage panel loads
2. Record a test payment offline (devtools → offline) — verify queue banner
3. Approver → Offline Sync — confirm conflict list endpoint responds
4. Install PWA — verify `start_url` opens collector dashboard

## Historical deployment evidence

Pre-v1.0 deployment, rollback, and recovery reports are archived under `docs/archive/page-validation/` and `docs/archive/v1.0.0-rc1.4/`.
