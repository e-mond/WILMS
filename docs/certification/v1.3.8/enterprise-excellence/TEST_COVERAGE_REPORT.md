# Test Coverage Report

**Date:** 17 July 2026

## Strengths

- Financial integrity P0 unit suite
- Reconciliation domain/service tests
- RBAC financial endpoint tests
- Health watermark tests
- Empty-list handlers (updated for new dashboard mocks)
- Tour route regression tests (+ resume/analytics assertions)

## Gaps (important workflows)

| Workflow | Gap | Priority |
|---|---|---|
| Loan fee→approve→disburse→collect→reverse E2E | Mostly verification scripts, not CI e2e | High |
| Concurrent payment + idempotency required | Key still optional | High |
| Offline queue drain | Limited automation | High |
| Tour keyboard / resume behavior | String tests only | Medium |
| Cross-browser / mobile visual | Manual / prior cert | Medium |
| Race on pool capital | Unit missing under contention | Medium |

## Sprint test updates

- `list-handlers.test.ts` mocks new sum helpers
- `product-tour-routes.test.ts` asserts resume-later keys

## Target for v1.4

- Require Idempotency-Key + tests
- Playwright smoke for collector payment + recon
- Contract tests for dashboard KPI SQL vs pool aggregates
