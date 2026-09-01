# Payment Day Reassignment Specification

**Product:** WILMS v1.8.0  
**Status:** Implemented (request → review → approve)

## Process

1. Super Admin requests change via `/ops/reassignment` → payment day tab (`POST /loans/:id/schedule-change`).
2. Approvers and Super Admins are notified in-app. Assigned collector receives an in-app alert when the request is created.
3. Approver reviews (`POST /loan-schedule-changes/:id/review`). Requester is notified; Super Admins are alerted that approval is pending.
4. A **different** Super Admin approves (`POST /loan-schedule-changes/:id/approve`). Reviewer cannot approve the same change.
5. Domain recalculates **PENDING** weeks with due date ≥ effective from onto the new weekday (holiday-aware).
6. Historical PAID / MISSED weeks are preserved.
7. Loan `paymentDay` updated.
8. Borrower notified via SMS/email (`emitScheduleChangedNotification`). Assigned collector and requester receive in-app alerts.
9. Audit `LOAN_SCHEDULE_CHANGE_APPROVED`.

Approvers may reject pending requests (`POST /loan-schedule-changes/:id/reject`). Only one active `PENDING` or `REVIEWED` request is allowed per loan.

## APIs

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| POST | `/loans/:id/schedule-change` | `MANAGE_SYSTEM_SETTINGS` | Create request |
| POST | `/loans/:id/schedule-change/preview` | `MANAGE_SYSTEM_SETTINGS` \| `APPROVE_BORROWERS` | Server-side impact preview |
| GET | `/loans/:id/schedule-changes/pending` | `APPROVE_BORROWERS` \| `MANAGE_SYSTEM_SETTINGS` | Active pending change for loan |
| GET | `/loan-schedule-changes/pending` | `APPROVE_BORROWERS` \| `MANAGE_SYSTEM_SETTINGS` | Global queue |
| POST | `/loan-schedule-changes/:id/review` | `APPROVE_BORROWERS` | Review step |
| POST | `/loan-schedule-changes/:id/reject` | `APPROVE_BORROWERS` \| `MANAGE_SYSTEM_SETTINGS` | Reject request |
| POST | `/loan-schedule-changes/:id/approve` | `MANAGE_SYSTEM_SETTINGS` | Apply recalculation |

Approver UI: `/approver/schedule-changes`. Super Admin queue: `/ops/reassignment?tab=payment-day`.

## Recalculation helper

`recalculatePendingDueDatesForPaymentDay` in `packages/domain/src/domain/loan/schedule.ts`.

## Impacts

| Area | Effect |
|------|--------|
| Expected collections | Future due dates shift after approval |
| Reconciliation | Expectations follow new weekday |
| Reports | Schedule-driven metrics refresh after approval |
| Historical payments | Unchanged |
| Loan detail UI | Shows pending-change banner until approved or rejected |

## Preview

UI calls `POST /loans/:id/schedule-change/preview` before confirm. Approval returns `recalculatedWeeks` and `nextDueDate`.
