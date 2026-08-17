# Scheduler Notification Timing

**Product version:** 1.8.1 (maintenance)  
**Language:** British English  
**Cron:** `0 6 * * *` UTC → `GET /api/cron/notifications` (`vercel.json`)  
**Timezone:** Africa/Accra (Ghana, UTC+0). 06:00 UTC is 06:00 Ghana time.  
**Service:** `packages/domain/src/modules/notifications/payment-scheduler.service.ts`

The scheduler is HTTP-triggered, not a durable queue. It is safe to rerun: delivery is gated by `notification_delivery_records`.

## v1.8.1 T-1 reminder root cause

Traced path: ACTIVE loan → next PENDING week → due date → Vercel Cron `GET /api/cron/notifications` → bearer auth → eligibility → SMS template → provider → `notification_delivery_records`.

Findings:

1. **Due-date matching.** The scheduler compared `week.dueDate === reminderDueDate` as raw strings. Values such as `2026-08-18T00:00:00.000Z` do not equal `2026-08-18`, so T-1 never matched. Matching now normalises to a Ghana (`Africa/Accra`) calendar date. Invalid or missing `paymentReminderDaysBefore` (including `0`) now defaults to **1**.
2. **Next payable week.** T-1 now uses only the earliest PENDING week, not every later pending week that happens to fall on tomorrow.
3. **Failed SMS retry.** A `FAILED` delivery row (or in-memory claim) blocked the next run. Failed rows can now be reclaimed; successful sends remain unique and idempotent.
4. **Cron authentication.** Production environment listing shows `CRON_SECRET` present and `WILMS_SCHEDULER_TOKEN` absent. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that variable exists. The route continues to require that bearer (or `WILMS_SCHEDULER_TOKEN` for manual runs). `x-vercel-cron` is **not** authentication. Unauthenticated `GET /api/cron/notifications` returns 401. Historical Cron invocation logs were not available from this session; post-deploy verification must confirm the 06:00 UTC job itself.

`WILMS_SCHEDULER_TOKEN` is retained for non-Vercel and operator invocations (`POST /notifications/scheduler/run`).

## Authentication

| Caller | Required credential | Header |
|--------|---------------------|--------|
| Vercel Cron (production) | `CRON_SECRET` | `Authorization: Bearer $CRON_SECRET` (injected by Vercel) |
| Manual / GitHub / non-Vercel | `WILMS_SCHEDULER_TOKEN` | `Authorization: Bearer` or `x-wilms-scheduler-token` |
| Operator in session | Session + `MANAGE_COMMUNICATION_SCHEDULER` | `POST /notifications/scheduler/run` only |

`WILMS_SCHEDULER_TOKEN` is retained for non-Vercel invocations. It is not a substitute for `CRON_SECRET` on Vercel Cron.

Local and automated tests supply one of those secrets in the environment. Missing both secrets fails closed (401). Secrets are never logged.

## Daily window

| Clock | Meaning |
|-------|---------|
| 06:00 UTC / 06:00 Africa/Accra | Production cron fires once per calendar day |
| Reference date | `YYYY-MM-DD` in Africa/Accra (`calendarDateInTimeZone()` unless an operator supplies a date) |
| Lead days | `settings.paymentReminderDaysBefore` (default **1**; invalid/missing/non-positive values fall back to **1**) |
| Grace days | `settings.latePaymentGraceDays` (organisation setting; default **3** in ladder fallback) |

## Exact triggers per active loan

For each ACTIVE loan with outstanding balance > 0, T-1 and due-today use **only the next PENDING (payable) week**:

| Notification | Condition | Dedupe key |
|--------------|-----------|------------|
| 1-day reminder | Next PENDING week `dueDate` (normalised) = `referenceDate + leadDays` | `payment-due-soon:{loanId}:{dueDate}` |
| Due today | Next PENDING week `dueDate` = `referenceDate` | `payment-due-today:{loanId}:{dueDate}` |
| Missed payment | Weeks newly marked missed by `applyMissedWeekMarking` | `payment-missed:{loanId}:{dueDate}` |
| Grace reminder | Week missed/pending-past-due and `daysPast === graceDays` | `payment-overdue-{n}d:{loanId}:{dueDate}` |
| Escalation | `daysPast === graceDays + 1` | `payment-overdue-{n}d:{loanId}:{dueDate}` |
| Staff Super Admin alert | `daysPast === graceDays + 2` or `daysPast === 7` | same ladder key + `:admin` |

`daysPast` is calendar days between the normalised week due date and the reference date (UTC midnight of those calendar dates).

## Eligibility (T-1 SMS)

Sent only when all of the following hold:

- Loan `externalStatus = ACTIVE` with outstanding balance > 0
- Next unpaid week is `PENDING` (not PAID / MISSED / later weeks)
- That week’s due date is tomorrow (lead days, default 1)
- Borrower has a valid Ghana mobile number
- SMS notifications are enabled in settings
- SMS provider is configured
- No successful delivery already recorded for `payment-due-soon:{loanId}:{dueDate}`

## Retry and idempotency

- Successful SMS: unique `(dedupeKey, recipient, channel)` prevents duplicates when cron runs twice.
- Failed SMS: the delivery row is `FAILED` and the next scheduler run may reclaim it and retry.
- In-memory (test) dedupe clears the claim on `FAILED` so retries work without PostgreSQL.

## Required Vercel Production environment variables

| Name | Required for Vercel Cron | Purpose |
|------|--------------------------|---------|
| `CRON_SECRET` | **Yes** | Bearer Vercel attaches to `/api/cron/notifications` |
| `WILMS_SCHEDULER_TOKEN` | Recommended | Manual / non-Vercel scheduler invocations |
| `DATABASE_URL` | Yes | Scheduler reads ACTIVE loans and schedules |
| SMS provider vars | Yes | `SMS_PROVIDER` / `SMSNOTIFYGH_*` as configured |

Never commit secret values. Adding `CRON_SECRET` requires a Production redeploy so the running app can verify the bearer.

## What the scheduler does not send

- Payment receipts (sent at record time)
- Registration / loan lifecycle messages (sent at the service call)
- Duplicate reminders for PAID or already-notified weeks
- T-1 SMS to inactive/closed loans, fully paid loans, or borrowers without a valid phone number

## Operational jobs on the same cron

`processOperationalNotificationJobs` also runs: reconciliation reminders, failed-delivery digest, overdue group alerts. These are staff-facing and do not duplicate borrower SMS.
