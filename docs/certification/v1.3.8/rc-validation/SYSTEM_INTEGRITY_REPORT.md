# System Integrity Report

**Date:** 17 July 2026

## Integrity model (validated)

| Layer | Mechanism | Status |
|---|---|---|
| Loan lifecycle | PENDING_APPROVAL → approve → PENDING_DISBURSEMENT → disburse | Enforced |
| Admin fee | assert on create/approve/disburse | Enforced |
| Pool capital | Hard stop on disburse | Enforced |
| Payments | Immutable PATCH 409; GPS required | Enforced |
| Reversals | Ledger REVERSAL + negative pool REPAYMENT | Enforced |
| Expenses | Operating cash only | Enforced |
| Idempotency | Optional key on money posts | Residual Medium |
| Optimistic locking | version columns on money entities | Present |

## Invariants re-checked

1. Expenses never mutate loan principal / pool capital — **holds**  
2. Reversed payments excluded from confirmed sums — **holds** (SQL `status != REVERSED`)  
3. Dashboard collection KPIs not silently capped at 2000 when DB on — **holds** after Phase 18  
4. Collectors cannot manage groups — **holds** (shared-rbac)

## Residual integrity risks (not Critical)

- `listLoans()` / `listBorrowers()` still used for some dashboard segment counts (scale Medium)  
- In-process notification loss on crash (Infrastructure)  
- Optional Idempotency-Key (Medium)
