# System Optimization Report

**Date:** 17 July 2026

## Optimizations shipped

1. **Payment KPI aggregates** — `sumConfirmedPaymentsPesewas`, `sumConfirmedPaymentsSincePesewas`, `sumConfirmedPaymentsByCollector` replace uncapped `listPayments()` for dashboard math.
2. **Collector expected due** — `sumExpectedWeeklyByCollector` single SQL vs N×3 queries.
3. **Indexes (0027)** — `(collector_user_id, payment_date)`, `ledger_entries(loan_id)`, `payments(loan_id)`.

## Still hot

| Path | Issue | Next |
|---|---|---|
| `listBorrowers()` in dashboard | Full load for segments | `GROUP BY status` SQL |
| `listLoans()` in financial overview | Full scan for active/closed counts | Aggregate query |
| `getExpenseSummary` | Loads all expenses | SQL date-window sums |
| Frontend lists | Client slice | Cursor pagination APIs |

## Caching

None at app layer. Safe candidate: holidays + system settings (short TTL). Never cache loan balances without invalidation.
