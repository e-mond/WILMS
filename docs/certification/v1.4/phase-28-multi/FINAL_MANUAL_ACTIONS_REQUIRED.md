# Final Manual Actions Required

**Version:** 1.4.2 | **Date:** 2026-07-21

## 1. Staging Smoke (Operations)

```bash
export STAGING_API_URL=https://staging.example.com
export STAGING_ADMIN_EMAIL=...
export STAGING_ADMIN_PASSWORD=...
npm run smoke:staging -w @wilms/api
npm run smoke:rbac -w @wilms/api
```

**Evidence:** HTTP log with status codes (PII redacted).

## 2. Money-Chain (Operations + Finance)

Full chain: Registration → Audit. Reconcile pool/collections/outstanding at each step.

**Evidence:** Transaction chain spreadsheet with entity IDs and amounts.

## 3. Migration 0029 Live (DBA)

```bash
DATABASE_URL=<staging> npm run db:migrate -w @wilms/api
psql $DATABASE_URL -c "\d invitation_tokens"
```

## 4. Backup/Restore (Operations)

```bash
npm run drill:backup-restore
```

**Evidence:** Backup size, restore duration (RTO), row-count comparison.

## 5. Load Test (SRE)

k6 against staging — 50 VUs collectors, 10 VUs reports.

**Evidence:** p95 latency report.

## 6. Production Config (Security/Ops)

Verify all secrets in manager. Confirm demo purge SQL returns 0 rows.

## 7. Accessibility (QA)

Manual WCAG pass on desktop/tablet/mobile with screen reader.

## Sign-offs

- [ ] Engineering Lead
- [ ] Security Lead
- [ ] Operations Lead
- [ ] Product Lead
