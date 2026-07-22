# Phase 32 — Manual Actions Required

## Priority 1 — Staging credentials

```bash
export STAGING_API_URL=https://<your-staging-api>
export STAGING_ADMIN_EMAIL=<non-demo-admin>
export STAGING_ADMIN_PASSWORD=<secret>
export STAGING_DATABASE_URL=<neon-staging-url>
export WILMS_SCHEDULER_TOKEN=<openssl rand -hex 32>
```

## Priority 2 — Run gates

```bash
npm run verify:phase32
DATABASE_URL=$STAGING_DATABASE_URL npm run db:migrate -w @wilms/api
bash scripts/operator/run-staging-gates.sh
bash scripts/operator/run-notification-scheduler-gate.sh
bash scripts/operator/run-money-chain-gate.sh
WILMS_BACKUP_DATABASE_URL=... WILMS_RESTORE_DATABASE_URL=... npm run drill:backup-restore
```

## Priority 3 — Provider evidence

Send test email and SMS on staging. Attach redacted provider message IDs to `evidence/operator/provider-delivery.json`. Distinguish CREATED / ACCEPTED / DELIVERED.

## Priority 4 — Manual QA

Complete WCAG checklist (`docs/certification/v1.4/phase-29/templates/wcag-manual-checklist.md`). Run Lighthouse on staging. Record browser matrix.

## Priority 5 — Sign-offs

Complete templates in `templates/` with evidence references. Update `signoff-manifest.json`.

## Never

- Fabricate credentials or delivery receipts
- Restore backups into production
- Use `@wilms.demo` accounts for staging certification
