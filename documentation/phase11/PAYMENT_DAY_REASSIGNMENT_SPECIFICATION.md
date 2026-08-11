# Payment Day Reassignment Specification

**Product:** WILMS v1.8.0  
**Status:** Implemented (request + approve recalculation)

## Process

1. Super Admin requests change via `/ops/reassignment` → payment day tab (`POST /loans/:id/schedule-change`).
2. Approver/Super Admin approves (`POST /loan-schedule-changes/:id/approve`).
3. Domain recalculates **PENDING** weeks with due date ≥ effective from onto the new weekday (holiday-aware).
4. Historical PAID / MISSED weeks are preserved.
5. Loan `paymentDay` updated.
6. Borrower notified (`emitScheduleChangedNotification`).
7. Audit `LOAN_SCHEDULE_CHANGE_APPROVED`.

## Recalculation helper

`recalculatePendingDueDatesForPaymentDay` in `packages/domain/src/domain/loan/schedule.ts`.

## Impacts

| Area | Effect |
|------|--------|
| Expected collections | Future due dates shift |
| Reconciliation | Expectations follow new weekday |
| Reports | Schedule-driven metrics refresh after approval |
| Historical payments | Unchanged |

## Preview

UI requires an explicit preview before confirm. Approval returns `recalculatedWeeks` and `nextDueDate`.
