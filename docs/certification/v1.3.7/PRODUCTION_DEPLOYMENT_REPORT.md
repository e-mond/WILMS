# Production Deployment Report — v1.3.7

**Date:** 2026-07-13  
**Verdict:** **PARTIALLY DEPLOYED — NOT VALIDATED**

---

## Deployment status

| Component | URL | Version | Status |
|-----------|-----|---------|--------|
| Frontend (Vercel) | https://wilms.vercel.app | v1.3.7 (inferred) | **LIVE** — `/login` HTTP 200 |
| API (Railway) | https://wilms-production.up.railway.app | **1.3.7** | **LIVE** — health HTTP 200 |
| Database (Neon) | via Railway `DATABASE_URL` | — | **CONNECTED** — degraded schema |
| Uploads (Cloudinary) | — | — | **VALID** |
| Queue workers | — | — | **NOT VERIFIED** |
| Background jobs | — | — | **NOT VERIFIED** |
| Scheduled tasks | — | — | **NOT VERIFIED** |
| Notification services | — | — | **NOT VERIFIED** |

---

## API health snapshot (2026-07-13T15:57Z)

```json
{
  "status": "degraded",
  "version": "1.3.7",
  "gitCommit": "7b3bdb27a415ff3a4a799606353958cab6bbf483",
  "environment": "production",
  "database": { "connected": true },
  "migrations": { "expected": 24, "applied": 23, "status": "degraded" },
  "schema": {
    "status": "degraded",
    "missingTables": [
      "organization_holidays",
      "loan_fee_charges",
      "loan_penalty_rules"
    ]
  },
  "uploads": { "activeProvider": "cloudinary", "valid": true },
  "runtime": {
    "nodeVersion": "v20.20.2",
    "deployedAt": "2026-07-13T15:39:25.157Z"
  }
}
```

---

## Environment variables

| Check | Result |
|-------|--------|
| `WILMS_API_UPSTREAM` on Vercel | **NOT VERIFIED** (no Vercel console) |
| `DATABASE_URL` on Railway | Configured (DB connected) |
| Cloudinary keys | Valid per health |
| Demo/mock flags | Demo banner absent on login HTML |
| Mail / SMS | **NOT VERIFIED** |

---

## Migration state

| Item | Detail |
|------|--------|
| Latest applied (prod) | 23 of 24 expected at probe time |
| Pending | `0023`–`0026` after remediation deploy |
| Post-fix expected count | **27** migrations |

**Action:** Operator must run `npm run db:migrate -w @wilms/api` against production `DATABASE_URL`.

---

## Deploy sequence (operator)

```bash
# 1. Backup
pg_dump "$DATABASE_URL" --format=custom --file=wilms-pre-migrate.dump

# 2. Migrate (from repo with updated journal)
npm install
npm run db:migrate -w @wilms/api

# 3. Verify
curl -fsS https://wilms-production.up.railway.app/health | jq '.data.status, .data.migrations, .data.schema'

# 4. Smoke
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
WILMS_SMOKE_EMAIL=... \
WILMS_SMOKE_PASSWORD=... \
npm run smoke:production -w @wilms/api
```

---

## Services not confirmed

The following require Railway/Vercel operator verification:

- Email dispatch (`WILMS_VERCEL_MAIL_URL`)
- SMS provider keys
- Cron / scheduler (`communications/scheduler`)
- Push notification bridge
- File storage write test (upload borrower photo)

---

## Verdict

**v1.3.7 binaries are deployed** but the production environment is **not deployment-validated** due to degraded database schema and incomplete migration application.
