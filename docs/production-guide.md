# WILMS Production Guide

**Last updated:** 2026-07-05 (v1.0.1 maintenance)

## Live services

| Service | URL |
|---------|-----|
| Frontend | https://wilms.vercel.app |
| API | https://wilms-production.up.railway.app |
| Health | https://wilms-production.up.railway.app/health |

## Operating rules

- Production must use live API mode, not mock mode.
- Production database changes must come from committed Drizzle migrations.
- Historical repair scripts are retained for auditability but should not run without an explicit recovery plan.
- Uploads use Cloudinary in production.
- SMS uses SMSNotifyGH in production.

## Verification commands

```bash
npm run verify:deploy-sync
npm run smoke:production
npm run smoke:rbac
npm run verify:empty-db
```

## Data hygiene

Financial demo data must not exist in production. Use the cleanup/audit scripts only with explicit approval:

```bash
node apps/backend/scripts/cleanup-demo-financial-data.mjs --dry-run
node apps/backend/scripts/audit-prod-db.mjs
```

## Historical records

Historical production recovery and smoke reports are archived under `docs/archive/`.