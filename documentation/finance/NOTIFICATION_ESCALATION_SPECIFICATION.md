# Notification Escalation Specification

**Product version:** 1.8.0  
**Scope:** Payment due / missed / overdue escalation timeline, channels, dedupe, and quiet hours  
**Language:** British English  
**Status:** Product / operations specification

---

## Purpose

Specify the coherent **T−1 … T+7** payment notification ladder for WILMS 1.8.0. Implementation reuses existing `payment-notifications` emitters and `processPaymentNotificationJobs` rather than introducing a separate escalation engine.

Related: `GRACE_PERIOD_SPECIFICATION.md`, `SCHEDULER_EXTENSION_SPECIFICATION.md`.

---

## Timeline (product ladder)

Let **T** = schedule week `dueDate`. Let **G** = `latePaymentGraceDays` (default **3**). Due-soon lead uses `paymentReminderDaysBefore` (default **1** → T−1).

| Relative day | Event | Primary recipients | Emitter / job |
|--------------|-------|--------------------|---------------|
| **T−1** (or T−`paymentReminderDaysBefore`) | Due soon | Borrower (+ staff channels as configured) | `emitPaymentDueSoonNotification` |
| **T** | Due today | Borrower (+ staff as configured) | `emitPaymentDueTodayNotification` |
| **T+1** | Missed / first overdue step | Borrower, assigned collector | Ladder day `1` and/or missed path when applicable |
| **T+G** | Grace ending | Borrower, collector | `emitPaymentOverdueLadderNotification` (`daysOverdue === graceDays`) |
| **T+G+1** | Collector follow-up | Assigned collector (borrower SMS skipped at this step) | Ladder (`graceDays + 1`) |
| **T+G+2** | Super Admin delinquency | Super Admin / admin summary path | Ladder (`graceDays + 2`) |
| **T+7** | Escalated delinquency | Borrower + elevated staff / admin | Ladder (`daysOverdue >= 7`) |

**Default G = 3**

| Calendar offset | Label |
|-----------------|-------|
| T−1 | Due soon |
| T | Due today |
| T+1 | Missed / early overdue |
| T+3 | Grace ending |
| T+4 | Collector alert |
| T+5 | Super Admin alert |
| T+7 | Escalated |

Automated schedule `MISSED` marking runs in the same daily pass via `applyMissedWeekMarking` after grace expires; missed notifications use `emitPaymentMissedNotification` for newly marked weeks.

---

## Reuse of existing stack

| Component | Role |
|-----------|------|
| `packages/domain/src/infrastructure/notifications/payment-notifications.ts` | Due soon, due today, missed, overdue ladder, admin summary, payment confirmed |
| `packages/domain/src/modules/notifications/payment-scheduler.service.ts` | Daily scan of active loans; invokes emitters at matching day offsets |
| Settings | `latePaymentGraceDays`, `paymentReminderDaysBefore`, `missedPaymentSmsEnabled`, global SMS enablement |

Do **not** invent a parallel cron worker for this ladder; extend thresholds and copy inside the existing scheduler + emitters.

---

## Channels

| Channel | Typical use on this ladder |
|---------|----------------------------|
| SMS | Borrower due / missed / overdue (gated by SMS + missed-payment settings) |
| In-app | Collector and staff alerts |
| Admin summary | Aggregated missed / SA delinquency steps |

At **T+G+1** and **T+G+2**, borrower SMS may be suppressed so the step is staff-focused (collector or Super Admin), matching current ladder branching.

---

## Quiet hours and dedupe

| Control | Behaviour |
|---------|-----------|
| **Dedupe keys** | Per event type + loan + due date (and overdue day offset), enforced via `notification_delivery_records` unique constraints |
| **Safe reruns** | Scheduler may run more than once per day; duplicates are not re-delivered |
| **Quiet hours** | Organisation preferences (`quietHoursEnabled`, start/end, timezone default `Africa/Accra`) suppress non-critical deliveries when enabled |
| **Critical override** | Security / ops-critical alerts may bypass quiet hours; payment ladder messages follow preference gating unless product marks a step critical |

Dedupe examples:

| Event | Key pattern (illustrative) |
|-------|----------------------------|
| Due soon | `payment-due-soon:{loanId}:{dueDate}` |
| Due today | `payment-due-today:{loanId}:{dueDate}` |
| Missed | `payment-missed:{loanId}:{dueDate}` |
| Overdue ladder | `payment-overdue-{N}d:{loanId}:{dueDate}` |

---

## Scheduler day matching

For unpaid / missed-eligible weeks, the daily job fires the overdue ladder when `daysPastDue` equals one of:

- `1`
- `latePaymentGraceDays`
- `latePaymentGraceDays + 1`
- `latePaymentGraceDays + 2`
- `7`

Due-soon and due-today use exact `dueDate` equality against the reminder target date and reference date.

---

## Operational notes

| Note | Detail |
|------|--------|
| Fully paid loans | Skipped (`loanBalance ≤ 0`) |
| Inactive / missing borrower | Skipped with counters |
| Correlation | Each scheduler run carries a `correlationId` for tracing |
| SMS cost | Missed / overdue SMS remain settings-gated |

---

## Source of truth

| Area | Path |
|------|------|
| Emitters | `packages/domain/src/infrastructure/notifications/payment-notifications.ts` |
| Scheduler | `packages/domain/src/modules/notifications/payment-scheduler.service.ts` |
| Preferences / quiet hours | `packages/domain/src/modules/notifications/preferences.service.ts` |
| Dedupe helpers | `packages/domain/src/infrastructure/notifications/notification-dedupe.js` (module) |

---

*End of notification escalation specification — WILMS 1.8.0*
