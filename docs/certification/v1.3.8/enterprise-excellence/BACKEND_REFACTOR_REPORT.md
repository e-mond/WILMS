# Backend Refactor Report

**Date:** 17 July 2026

## Completed

- Dashboard: SQL aggregates for collections + collector performance
- Payment repository: sum helpers (confirmed / since / by collector)
- Loan repository: `sumExpectedWeeklyByCollector`
- Types: re-export financial overview from single module
- Migration 0027 hot indexes + journal entry

## Deferred

| Item | Why defer |
|---|---|
| Split `settings/service.ts` | Large behavioral risk; schedule v1.4 |
| Wire `LOAN_CREATE` idempotency | Needs frontend key on create |
| Expense SQL summaries | Separate PR with tests |
| Borrower segment SQL | Dashboard still uses listBorrowers |

## Maintainability

Prefer repository SQL helpers over service-level `list*` + JS reduce for any money KPI.
