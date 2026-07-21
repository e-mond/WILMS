# Final Manual Actions Required

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

All items below require real infrastructure, credentials, or human approval. **Do not fabricate evidence.**

## 1. Staging Smoke + RBAC (Operations)

```bash
export STAGING_API_URL=https://staging.example.com
export STAGING_ADMIN_EMAIL=admin@yourorg.example
export STAGING_ADMIN_PASSWORD='...'
# Optional per-role accounts:
export STAGING_COLLECTOR_EMAIL=...
export STAGING_COLLECTOR_PASSWORD=...
bash scripts/operator/run-staging-gates.sh
```

Evidence: `docs/certification/v1.4/phase-29/evidence/operator/staging-gates-*.json`

## 2. Money-Chain Reconciliation (Operations + Finance)

Execute: Registration → Group → Loan → Approval → Admin fee → Disbursement → Collection → Reconciliation → Reversal → Expense → Reports.

Template: [templates/MONEY_CHAIN_EVIDENCE_TEMPLATE.md](templates/MONEY_CHAIN_EVIDENCE_TEMPLATE.md)

## 3. Migration 0029 Live Apply (DBA)

```bash
DATABASE_URL=<staging> npm run db:migrate -w @wilms/api
psql "$DATABASE_URL" -c "\d invitation_tokens"
```

## 4. Backup / Restore Drill (Operations)

```bash
WILMS_BACKUP_DATABASE_URL=<source> \
WILMS_RESTORE_DATABASE_URL=<isolated-restore> \
npm run drill:backup-restore
```

Record RPO/RTO from drill output.

## 5. Load Test (SRE)

k6 against staging: 50 VU collectors, 10 VU reports. Capture p95 latency.

## 6. Production Secrets (Security/Ops)

Verify all variables in [docs/operations/ENVIRONMENT_VARIABLES.md](../../../operations/ENVIRONMENT_VARIABLES.md) are set in secret manager.

## 7. Demo User Purge (Operations)

```sql
SELECT id, email FROM users WHERE email LIKE '%@wilms.demo';
-- Must return 0 rows before production
```

## 8. WCAG Manual Audit (QA)

Checklist: [templates/WCAG_MANUAL_CHECKLIST.md](templates/WCAG_MANUAL_CHECKLIST.md)

## 9. Browser / Mobile / Lighthouse (QA)

Test Chrome, Firefox, Safari; iOS/Android; run Lighthouse on staging.

## 10. Mail / SMS / Upload (Operations)

Send test invite, password reset, SMS notification; upload document via UI.

## 11. Monitoring + Incident + Rollback Drills (Operations)

Verify alerts fire; run tabletop incident; execute rollback on staging.

## 12. Sign-offs

Template: [templates/SIGN_OFF_TEMPLATE.md](templates/SIGN_OFF_TEMPLATE.md)

- [ ] Engineering Lead
- [ ] Security Lead
- [ ] Operations Lead
- [ ] Product Lead

## Automated Pre-check (run first)

```bash
npm run verify:phase29
```

Must show **13/13 PASS** before operator gates.
