# Backup & Disaster Recovery Certification

**Version:** 1.4.2 | **Date:** 2026-07-21

## Status

**BLOCKED — DATABASE ACCESS REQUIRED**

No backup or restore was executed. Evidence was not fabricated.

## Operator Runbook

```bash
# Backup
pg_dump "$DATABASE_URL" --format=custom --file=wilms-$(date +%Y%m%d).pgdump

# Restore to isolated DB
pg_restore --dbname="$RESTORE_DB_URL" --no-owner wilms-*.pgdump

# Verify
psql $RESTORE_DB_URL -c "SELECT COUNT(*) FROM loans;"
psql $RESTORE_DB_URL -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 1;"
```

## Targets (Unverified)

| Metric | Target |
|--------|--------|
| RPO | < 1 hour |
| RTO | < 2 hours |

## Script Available

`npm run drill:backup-restore` — requires DATABASE_URL.

## Status

**BLOCKED**
