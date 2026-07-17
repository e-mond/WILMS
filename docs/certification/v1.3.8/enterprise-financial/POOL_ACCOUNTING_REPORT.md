# Pool Accounting Report

**Date:** 17 July 2026

## Hard controls

1. **Disbursement capacity:** `amountPesewas ≤ capitalPesewas − outstandingPesewas` or validation error.
2. **Allocation on disburse:** `DISBURSEMENT` allocation + aggregate refresh.
3. **Allocation on collect:** `REPAYMENT` allocation + refresh (existing).
4. **Allocation on reverse:** negative `REPAYMENT` + refresh (this sprint).
5. **Expenses:** never create pool allocations.

## Utilisation

Derived from aggregates after refresh — not a free-standing mutable field.

## Loans without pools

If org has pools configured, disbursement requires a resolved `loanPoolId`. Empty-pool orgs (dev/demo) remain allowed for non-pool operation.
