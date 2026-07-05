# RC1.2 ÔÇö Database Audit

**Git SHA:** `e456febebf509d2672ea79741b6e9a59463de10d`  
**Date:** 2026-07-02T10:30:00Z  
**Branch:** `release/rc1-1-production-stabilization`  
**Commands run:**

```bash
# Production read-only
Invoke-RestMethod https://wilms-production.up.railway.app/health

# Staging cleanup (planned)
node apps/backend/scripts/cleanup-demo-financial-data.mjs --dry-run
```

**Result:** PASS (production audit) / **BLOCKED** (staging cleanup)

## Production health (read-only)

```json
{
  "status": "ok",
  "version": "0.2.2",
  "gitCommit": "cf3ce103d49a8b7c0d37a4dc813472461ef01895",
  "database": { "configured": true, "connected": true, "status": "connected" },
  "migrations": { "expected": 11, "applied": 11, "status": "ok" }
}
```

| Check | Result |
|-------|--------|
| Migrations | **11/11** (`0000`ÔÇô`0010`) |
| Sequential filenames | PASS ÔÇö no gaps |
| DB connected | PASS |
| Uploads (Cloudinary) | PASS |

**Deploy drift:** Production API `gitCommit` (`cf3ce10`) lags local/merged RC1.1 tip (`e456feb`) ÔÇö expected until post-merge Railway redeploy.

## Schema review (read-only)

| Area | Notes |
|------|-------|
| `apps/backend/src/db/schema/` | FK/index coverage on borrowers, loans, payments, groups, reconciliations |
| Orphan-table risk | Low ÔÇö Drizzle schema aligns with 11 migration files |
| Login accounts | Preserved per `P14.6-environment-and-credentials.md` |

## Staging demo financial cleanup

| Step | Status |
|------|--------|
| Backup staging DB | **Not run** ÔÇö no `DATABASE_URL` for staging in repo/CI secrets |
| `cleanup-demo-financial-data.mjs --dry-run` | **BLOCKED** |
| `cleanup-demo-financial-data.mjs --execute` | **BLOCKED** |
| Before/after counts | **Not available** |

**Reason:** Staging-first policy requires staging `DATABASE_URL`. Operator must run on Railway staging after backup.

## Production data policy

- **Read-only** counts only on production ÔÇö no cleanup executed
- Demo borrowers/seed loans documented in RC1.1; removal deferred until staging sign-off

## Pass gate

Migrations OK on prod; prod audit attached; staging cleanup **documented as blocked** with reason.
