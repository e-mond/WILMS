# Final Backup / DR Report

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

## Drill Script

```bash
WILMS_BACKUP_DATABASE_URL=<source> \
WILMS_RESTORE_DATABASE_URL=<isolated-restore-db> \
npm run drill:backup-restore
```

Evidence written to: `docs/certification/v1.4/phase-29/evidence/`

**Never point restore URL at production.**

## Procedures Documented

| Procedure | Location |
|-----------|----------|
| Backup/restore drill | `scripts/backup-restore-drill.mjs` |
| Migration recovery | `docs/operations/` (migration guide) |
| Rollback | Release runbook in certification pack |

## RPO / RTO

| Metric | Target | Evidence |
|--------|--------|----------|
| RPO | Operator-defined (PITR policy) | **BLOCKED** |
| RTO | Operator-defined | **BLOCKED** |

## Restore Validation

Drill script compares row counts post-restore when both URLs provided. Live drill **BLOCKED** in this environment (no database credentials).

## Status

**PASS (script + documentation)** | Live drill **BLOCKED**
