# Database Optimization Report

**Date:** 17 July 2026

## Migration 0027

```sql
payments (collector_user_id, payment_date)
ledger_entries (loan_id)
payments (loan_id)
```

**Apply:** `npm run db:migrate -w @wilms/api` on each environment after deploy.

## Integrity model (unchanged, confirmed sound)

- Soft-delete on domain entities; financial cores append / status-flip
- Rare CASCADE (`borrower_admin_fees`, fee charges)
- Optimistic `version` on money rows

## Next recommendations

| Item | Class |
|---|---|
| Partial index `payments(status) WHERE status = 'CONFIRMED'` if seq filters grow | Medium |
| `FOR UPDATE` on pool row during disburse under contention | Medium |
| Materialized daily KPI snapshot table | High (scale) |
| Align Drizzle schema index declarations with SQL migrations | Medium |

## Query plan note

Without production `EXPLAIN ANALYZE`, 0027 is justified by code-path evidence (collector-date filters, `listLedgerForLoan`). Validate after migrate with Neon query insights.
