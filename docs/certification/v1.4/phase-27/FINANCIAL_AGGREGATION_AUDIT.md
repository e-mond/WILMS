# Financial Aggregation Audit — Phase 27

## Scope

Reports and dashboard KPIs that previously risked 2000-row truncation or in-memory aggregation.

## Changes

| Metric / report | Strategy |
|-----------------|----------|
| Daily collection payments | `listPaymentsForDate` / `countPaymentsForDate` (SQL date filter) |
| Financial ledger | `listPaymentsInDateRange` with fail-closed if over cap |
| Expense summary (today/week/month/year) | SQL `SUM` of APPROVED only |
| Dashboard collections | Existing SQL sums (carry-forward) |
| Defaulters | Still list + fail-closed 422 (residual) |

## Source-of-truth notes

- Confirmed collections exclude `REVERSED`
- Expense operating cash uses APPROVED only after Phase 27
- Date fields use payment/expense calendar date strings (`YYYY-MM-DD`)

## Residual

Defaulter report and borrower full-list dependencies remain scale-sensitive; fail-closed retained.
