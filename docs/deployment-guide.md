# WILMS Deployment Guide

**Last updated:** 2026-07-05 (v1.0.1 maintenance)

## Deployment model

| Component | Platform | Deploy from |
|-----------|----------|-------------|
| Frontend | Vercel | repository root (`vercel.json`) |
| API | Railway | repository root (`Dockerfile`, `railway.toml`) |
| Database | Neon PostgreSQL | Drizzle migrations from `apps/backend` |
| Uploads | Cloudinary | Railway production env |

Always deploy from the monorepo root. Do not deploy `apps/backend/` in isolation because the API depends on workspace packages.

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

## Post-deploy validation

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production

WILMS_APP_URL=https://wilms.vercel.app \
npm run smoke:rbac
```

## Historical deployment evidence

Pre-v1.0 deployment, rollback, and recovery reports are archived under `docs/archive/page-validation/` and `docs/archive/v1.0.0-rc1.4/`.