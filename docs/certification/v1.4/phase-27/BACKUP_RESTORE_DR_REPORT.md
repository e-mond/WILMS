# Backup / Restore / DR Report — Phase 27

## Status: BLOCKED / OPERATOR REQUIRED

No production or staging Postgres access in this environment.

## Operator runbook (exact)

1. Snapshot Neon / provider backup; record timestamp and size
2. Restore to an isolated branch/database
3. Point a staging API at the restored `DATABASE_URL`
4. Run `npm run verify:migrations -w @wilms/api` with DB URL set
5. Reconcile collection totals vs pre-backup export
6. Record RTO/RPO and attach evidence here

Repo helper (software only): `npm run drill:backup-restore` when available locally — does **not** replace live provider restore evidence.
