# Phase 28H — Backup, Restore & DR Report

**Date**: 2026-07-21  
**Status**: BLOCKED — no database access

## Reason

Executing a backup/restore drill requires access to the staging or production PostgreSQL database. No `DATABASE_URL` was available in this environment.

## Required Runbook

### Step 1 — Backup

```bash
pg_dump "$STAGING_DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="wilms-$(date +%Y%m%d-%H%M%S).pgdump"
```

Record: backup timestamp, file size (bytes).

### Step 2 — Restore into Isolated Instance

```bash
createdb wilms_restore_test
pg_restore \
  --dbname="$RESTORE_DB_URL" \
  --no-owner \
  --no-privileges \
  wilms-<timestamp>.pgdump
```

Record: restore start, restore completion, elapsed seconds (= RTO).

### Step 3 — Schema Verification

```bash
psql $RESTORE_DB_URL -c "\dt" | sort
```

Expected: all tables from `apps/backend/src/db/schema/` present.

### Step 4 — Migration Watermark

```bash
psql $RESTORE_DB_URL -c \
  "SELECT * FROM drizzle_migrations ORDER BY id DESC LIMIT 5;"
```

Expected: last entry = `0029_v141_invitation_tokens`.

### Step 5 — Financial Totals

```bash
psql $RESTORE_DB_URL -c \
  "SELECT COUNT(*), SUM(loan_balance::numeric) FROM loans WHERE deleted_at IS NULL;"
psql $RESTORE_DB_URL -c \
  "SELECT COUNT(*), SUM(amount_pesewas) FROM payments WHERE status != 'REVERSED';"
```

Compare output against pre-backup figures.

### Step 6 — Data Integrity

```bash
psql $RESTORE_DB_URL -c \
  "SELECT COUNT(*) FROM audit_log;"
psql $RESTORE_DB_URL -c \
  "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;"
```

### Step 7 — Authentication Sanity

Attempt login with test account. Verify sessions table is intact.

## RTO / RPO Targets

| Metric | Target | Actual |
|--------|--------|--------|
| RPO (max data loss) | < 1 hour | UNTESTED |
| RTO (restore time) | < 2 hours | UNTESTED |
| Data integrity | 100% row count match | UNTESTED |

## Verdict

**BLOCKED / OPERATOR REQUIRED**  
Must be executed by the operator with database access before Production Certified can be issued.
