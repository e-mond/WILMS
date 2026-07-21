# Financial Engine Certification

**Version:** 1.4.2 | **Date:** 2026-07-21

## Source-of-Truth Rules

| Metric | Authoritative Field | Filter |
|--------|---------------------|--------|
| Outstanding | `loans.loan_balance` | non-deleted |
| Collections | `payments.amount_pesewas` | status != REVERSED |
| Expenses | `expenses.amount_pesewas` | status = APPROVED |
| Pool capital | loan pool allocations | transactional |

## SQL Aggregation Fixes (This Pass)

| Screen/Report | Before | After |
|---------------|--------|-------|
| Collector list KPIs | `listPayments()` cap 2000 | `sumConfirmedPaymentsByCollector()` |
| Collector portal daily | full payment scan | date-scoped SQL |
| Analytics metrics | in-memory filter | SQL sum/count by recordedAt |
| Group detail | in-memory payments | `getGroupListStats()` |
| Defaulter report | N+1 + cap | SQL CTEs |
| Ledger repayments helper | in-memory reduce | SQL SUM |

## Maker-Checker (Financial)

Loans, adjustments, expenses, borrowers (new), reconciliations (new) enforce separation of duties.

## Financial Harness

`npm run verify:financial`: **22/23 PASS** — database checks skipped (no DATABASE_URL).

## Live Money-Chain

**BLOCKED** — requires staging environment. Operator must execute full chain and reconcile pool/collections/outstanding.

## Status

**PASS (code-level)** | Live reconciliation **BLOCKED**
