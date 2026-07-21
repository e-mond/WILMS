# Phase 28B — Defaulter SQL Aggregation Report

**Date**: 2026-07-21  
**Version**: v1.4.2

## Finding

The defaulter report (`GET /reports/defaulters`) previously loaded all DEFAULTED loans from the in-memory store via `listLoans()` then called `countMissedWeeks(loanId)` in a per-row async loop (N+1 queries), reduced `outstandingPesewas` in application memory, and scanned all payments to find the last payment date. Under a 2,000-row cap, totals would silently truncate for large portfolios.

## Remediation

**New file**: `apps/backend/src/repositories/defaulter.repository.ts`

Implements `queryDefaulterAggregates()`:

- Joins `loans → borrowers → group_name_cte → missed_weeks_cte → last_payment_cte` in a single SQL query
- Missed weeks: `COUNT` of `loan_schedules WHERE status = 'MISSED'` GROUP BY `loan_id` in a CTE
- Last payment: `MAX(payment_date)` WHERE `status != 'REVERSED'` GROUP BY `borrower_id` in a CTE
- Outstanding: `ROUND(loan_balance * 100)::int` directly from `loans.loan_balance` (authoritative source)
- Group name: first non-removed group membership via LEFT JOIN CTE
- Filters: `externalStatus = 'DEFAULTED'` AND `deleted_at IS NULL`

**Updated route**: `apps/backend/src/modules/reports/routes.ts`

The defaulter route now calls `queryDefaulterAggregates()` first. If it returns data (database available), the SQL result is used directly. If it returns `null` (no `DATABASE_URL`), the existing in-memory path is used as a fallback with the existing `assertReportSourceNotTruncated` guard intact.

## Financial Source-of-Truth

- `outstandingPesewas` is derived from `loans.loan_balance` (same field used by loan portfolio and dashboard)
- Reversed payments are excluded from last-payment calculation (matches payment service rules)
- Only non-deleted loans are counted (matches `listLoans()` logic)

## Test Coverage

**New file**: `apps/backend/src/tests/reports/defaulter.test.ts` (4 tests)

| Test | Verifies |
|------|----------|
| Empty data | returns 0 defaulters, 0 outstanding |
| Status filter | only DEFAULTED loans included |
| Multiple defaulters | correct sum of outstanding |
| Last payment date | picks latest date across multiple payments |

All 4 tests pass. Type-check passes.

## Boundary Conditions

| Condition | Handling |
|-----------|----------|
| No defaulted loans | Empty rows, 0 totals |
| No payments recorded | `lastPaymentDate` is `null`/`undefined` |
| Reversed payments | Excluded from last-payment CTE |
| Borrower in multiple groups | COALESCE picks first joined group |
| No DATABASE_URL | Falls back to in-memory path with truncation guard |
| > 2,000 rows | SQL path has no cap — all defaulters returned |

## Status

CLOSED — SQL aggregation path implemented and tested.  
In-memory fallback retained for dev/test mode without a database.
