# Notification Trigger Matrix

**Product version:** 1.8.0  
**Language:** British English

Quiet hours and channel preferences in system settings still apply. Push is mirrored from in-app via `createInAppNotification` → `sendPushToUser` for users with a WILMS account.

| Event | Trigger | SMS | Email | In-app | Push |
|-------|---------|-----|-------|--------|------|
| Registration submitted | `notifyRegistrationSubmitted` after save | Yes | Optional | Yes (registration officer) | Optional |
| Registration approved | `notifyRegistrationApproved` after group assignment | Yes | Yes | Yes (collector when assigned) | Yes |
| Loan created | `notifyLoanCreated` after `createLoan` | Yes | Optional | Yes (collector if resolved) | Optional |
| Loan approved | `notifyLoanApproved` after approval | Yes | Yes | Yes (collector) | Yes |
| Admin fee received | `notifyAdminFeeRecorded` | Yes | Yes | Yes (collector) | Yes |
| Loan disbursed | `notifyLoanDisbursed` | Yes | Yes | Yes (collector) | Yes |
| Repayment schedule issued | Second SMS in `notifyLoanDisbursed` | Yes | Yes (with disbursement) | Yes | Yes |
| Reminder (1 day before) | Scheduler, pending week due = T+lead | Yes | Optional | Yes (staff mirror) | Yes |
| Due today | Scheduler, pending week due = today | Yes | No | Yes (staff mirror) | Yes |
| Missed payment | Scheduler newly marked missed | Yes | Yes | Yes (collector) | Yes |
| Weekly arrears reminder | Scheduler on payment day while MISSED weeks remain | Yes | No | Yes (collector) | Yes |
| Overdue ladder (weekly) | Scheduler every 7 days while overdue | Yes | No | Yes (collector) | Yes |
| Grace reminder | Ladder day = grace days | Yes | No | Yes (collector) | Yes |
| Escalation | Ladder day = grace + 1 | Yes | Yes (staff/admin) | Yes | Yes |
| Payment received | `emitPaymentConfirmedNotification` | Yes | Optional | Yes (collector) | Optional |
| Multi-week payment | Same emitter, `weeksPaid > 1` | Yes | Optional | Yes | Optional |
| Loan completed | `notifyLoanFullyPaid` | Yes | Yes | Yes (collector) | Yes |
| Collector changed | `notifyCollectorReassignedToBorrower` | Yes | Optional | Yes | Yes |
| Group changed | `notifyGroupAssigned` on transfer | Yes | Optional | Yes | Yes |
| Payment day change requested | `requestScheduleChange` | No | No | Yes (approvers, Super Admins, collector) | Yes |
| Payment day change reviewed | `reviewScheduleChange` | No | No | Yes (requester, Super Admins) | Yes |
| Payment day changed (approved) | `emitScheduleChangedNotification` + staff in-app | Yes | Yes | Yes (collector, requester) | Yes |
| Payment day change rejected | `rejectScheduleChange` | No | No | Yes (requester) | Yes |

## In-app recipient note

Borrowers do not currently hold WILMS user accounts. In-app and push for borrower-facing events are delivered to the **assigned collector, registration officer, or Super Admin**, not to a borrower inbox. SMS remains the primary borrower channel.
