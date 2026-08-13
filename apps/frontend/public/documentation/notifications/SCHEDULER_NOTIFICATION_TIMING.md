# Scheduler Notification Timing

**Product version:** 1.8.0  
**Language:** British English  
**Cron:** `0 6 * * *` UTC → `POST /api/cron/notifications` (`vercel.json`)  
**Service:** `packages/domain/src/modules/notifications/payment-scheduler.service.ts`

The scheduler is HTTP-triggered, not a durable queue. It is safe to rerun: delivery is gated by `notification_delivery_records`.

## Daily window

| Clock | Meaning |
|-------|---------|
| 06:00 UTC | Production cron fires once per calendar day |
| Reference date | `YYYY-MM-DD` in UTC (`todayIso()` unless an operator supplies a date) |
| Lead days | `settings.paymentReminderDaysBefore` (default **1**) |
| Grace days | `settings.latePaymentGraceDays` (organisation setting; default **3** in ladder fallback) |

## Exact triggers per active loan

For each ACTIVE loan with outstanding balance > 0:

| Notification | Condition | Dedupe key |
|--------------|-----------|------------|
| 1-day reminder | Week `status = PENDING` and `dueDate = referenceDate + leadDays` | `payment-due-soon:{loanId}:{dueDate}` |
| Due today | Week `status = PENDING` and `dueDate = referenceDate` | `payment-due-today:{loanId}:{dueDate}` |
| Missed payment | Weeks newly marked missed by `applyMissedWeekMarking` | `payment-missed:{loanId}:{dueDate}` |
| Grace reminder | Week missed/pending-past-due and `daysPast === graceDays` | `payment-overdue-{n}d:{loanId}:{dueDate}` |
| Escalation | `daysPast === graceDays + 1` | `payment-overdue-{n}d:{loanId}:{dueDate}` |
| Staff Super Admin alert | `daysPast === graceDays + 2` or `daysPast === 7` | same ladder key + `:admin` |

`daysPast` is calendar days between the week due date and the reference date (UTC midnight).

## What the scheduler does not send

- Payment receipts (sent at record time)
- Registration / loan lifecycle messages (sent at the service call)
- Duplicate reminders for PAID or already-notified weeks

## Operational jobs on the same cron

`processOperationalNotificationJobs` also runs: reconciliation reminders, failed-delivery digest, overdue group alerts. These are staff-facing and do not duplicate borrower SMS.
