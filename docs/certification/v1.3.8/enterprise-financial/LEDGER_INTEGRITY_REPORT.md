# Ledger Integrity Report

**System:** WILMS financial ledger  
**Date:** 17 July 2026

## Ledger model

| Layer | Source of truth | Mutability |
|---|---|---|
| Loan principal / balance | `loans` + lifecycle transitions | Append via disbursement / repayment / reversal |
| Cash movements | `ledger_entries` | Append-only |
| Pool capital / utilisation | `loan_pools` aggregates refreshed from `pool_allocations` | Aggregates derived; allocations append-only |
| Collections | `payments` (`CONFIRMED` / `REVERSED`) | Status flip to REVERSED; amount immutable |
| Admin fees | `borrower_admin_fees` | Append |
| Operating expenses | `expenses` + ledger `ADJUSTMENT` metadata `OPERATING_EXPENSE` | Soft-delete capable; financial history retained |
| Reconciliation | `financial_reconciliations` + `reconciliation_history` | Supersede only from REJECTED/REOPENED; history append-only |

## Invariants (enforced)

1. No disbursement without admin fee + `PENDING_DISBURSEMENT` lifecycle.
2. No disbursement exceeding `pool.capital − pool.outstanding`.
3. Reversal posts compensating pool allocation and ledger `REVERSAL`.
4. Progress / collected KPIs net `REPAYMENT − REVERSAL`.
5. Expenses never mutate loan principal or pool capital.
6. Posted payment amounts cannot be PATCH-edited.

## Gaps closed this sprint

- Interest-free narrative: zero `INTEREST_CHARGE` markers replaced with `ADJUSTMENT` lifecycle notes.
- Payment list defaults exclude `REVERSED` rows for KPI consumers.
- Expense create writes ledger + audit in the same transaction.
