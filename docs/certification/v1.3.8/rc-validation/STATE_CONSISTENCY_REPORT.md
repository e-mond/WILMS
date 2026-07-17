# State Consistency Report

**Date:** 17 July 2026

## Sources of truth (operational)

| Concern | SoT |
|---|---|
| Pool capital / disbursed / collected / outstanding | `loan_pools` aggregates ← `pool_allocations` |
| Confirmed collections | `payments` where status ≠ REVERSED |
| Loan outstanding | `loans.loan_balance` (mutable cache; ledger also append-only) |
| Operating expenses | `expenses` + ledger metadata OPERATING_EXPENSE |
| Executive KPIs (DB mode) | `buildDashboardFinancialOverview` (pools + SQL payment sums + expense summary) |

## Consistency checks performed

| Comparison | Result |
|---|---|
| Dashboard collections vs payment SUM SQL | Aligned when DB enabled |
| Pool collected vs payment sums | Prefer pool when populated; else payment SUM |
| Expense vs principal | Isolated (no principal write) |
| Reversal vs progress | sumRepaymentLedgerAmounts nets REVERSAL |

## Known residual disagreements (Medium, not invented)

1. **Statutory GL absent** — no trial balance to compare (architecture decision; Phase 17)  
2. **Borrower segment counts** still from `listBorrowers()` (may truncate at list caps under extreme scale)  
3. **Active loan counts** still iterate `listLoans()`  
4. Report UIs that still client-aggregate may diverge under pagination — recommend SQL-backed report endpoints in v1.4  

## Verdict

Operational state is **internally consistent for the remediated control set**. Absolute multi-screen agreement at 100k+ rows is **not proven** without load testing.
