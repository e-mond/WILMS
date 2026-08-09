# WILMS v1.8.0 — Disaster Recovery Certification

**Generated (UTC):** 2026-08-09T19:30:00Z

## Verdict

**BLOCKED**

## Attempt

```bash
node scripts/backup-restore-drill.mjs
```

Output: `SKIPPED: missing backup/restore database URLs`  
Evidence written by script under `docs/certification/v1.4/phase-32/evidence/backup-restore-drill-*.json` (historical path used by script).

## Required env

- `WILMS_BACKUP_DATABASE_URL`
- `WILMS_RESTORE_DATABASE_URL`

## RPO / RTO

**Not measured** — drill did not run.

## Close criteria

Execute backup-restore drill against disposable restore target; record durations and row-count verification; store JSON under `docs/v1.8.0/certification/evidence/`.
