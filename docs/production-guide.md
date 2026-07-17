# WILMS Production Guide

**Last updated:** 2026-07-17 (v1.3.8)

> **Canonical ops docs:** [`operations/`](./operations/) and [`certification/v1.3.8/production-operations/`](./certification/v1.3.8/production-operations/). This guide retains field-operations narrative; prefer the ops pack for deploy/monitor/IR.

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
- Offline financial mutations require approver review before posting.

## Field operations (v1.3.0)

| Concern | Guidance |
|---------|----------|
| PWA updates | Service worker cache version `wilms-v130-shell`; users may need refresh after deploy |
| Offline payments | Queue drains to `/sync/offline/batch`; approvers resolve at `/approver/sync-conflicts` |
| Upload queue | IndexedDB on device; monitor via collector Device health panel |
| Grace periods | `latePaymentGraceDays` in system settings (default 3) |

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
