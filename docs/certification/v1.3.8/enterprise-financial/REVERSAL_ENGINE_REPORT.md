# Reversal Engine Report

**Date:** 17 July 2026  
**Finding closed:** C-04

## Rollback checklist (per reversal)

| Target | Action |
|---|---|
| Payment | Status → `REVERSED` (amount retained) |
| Schedule week | Reverted to payable |
| Loan balance | Credited |
| Ledger | Append `REVERSAL` linked to original `REPAYMENT` |
| Pool | Negative `REPAYMENT` allocation + `refreshPoolAggregates` |
| Progress KPIs | `sumRepaymentLedgerAmounts` nets REVERSAL |
| Collector totals / dashboard | Exclude reversed via payment list filter |
| Audit | `reversal.requested` + `reversal.executed` |

## Forbidden paths

- In-place amount edit (`PATCH` → 409)
- Claiming pool unwind “out of scope”

## Residual

Concurrent double-reverse blocked by payment status / version conflict and `REVERSAL_DUPLICATE` checks (existing).
