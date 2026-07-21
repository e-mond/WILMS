# Phase 28F — Money-Chain Smoke Report

**Date**: 2026-07-21  
**Status**: BLOCKED — no staging environment available

## Reason

Executing the full money chain requires a live staging environment with database access and real accounts. No staging credentials or infrastructure were provided.

## Chain Definition

```
Registration → Group → Loan → Admin Fee → Loan Approval → Disbursement
→ Collection → Reversal → Expense Submission → Expense Approval
→ Reconciliation → Dashboard → Reports → Audit Log
```

## Steps and Required Evidence

For each step, record:

| Field | Requirement |
|-------|------------|
| Actor | Role + user ID |
| Timestamp | ISO 8601 UTC |
| Entity ID | UUID of created record |
| Amount | Pesewas |
| Expected state | E.g. `ACTIVE` |
| Actual state | From DB/API |
| Audit entry | Confirm audit log row exists |

## Financial Reconciliation Checks

After completion:

```
pool_capital = initial_pool_amount
disbursed_total = SUM(loan.disbursed_amount WHERE status IN (ACTIVE, COMPLETED))
collected_total = SUM(payments.amount_pesewas WHERE status = CONFIRMED)
outstanding_total = SUM(loan.loan_balance WHERE status = ACTIVE)
operating_cash = collected_total - disbursed_total - SUM(expenses.amount WHERE status = APPROVED)
reconciliation_variance = expected_collections - collected_total
```

All must reconcile to zero variance (or documented rounding delta).

## Required Environment Variables

Same as Phase 28E (staging credentials) plus:

```bash
STAGING_DB_URL=<postgres-connection-string>
```

## Verdict

**BLOCKED / OPERATOR REQUIRED**
