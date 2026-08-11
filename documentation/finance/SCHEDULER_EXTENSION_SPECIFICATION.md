# Scheduler Extension Specification

**Product version:** 1.8.0  
**Scope:** Payment notification daily jobs, idempotency, and HTTP cron route  
**Language:** British English  
**Status:** Operations / engineering specification

---

## Purpose

Document how WILMS runs payment due / missed / escalation work as an **HTTP-triggered daily job**, not as an embedded durable queue worker. Extensions for the T−1…T+7 ladder must remain inside `processPaymentNotificationJobs`.

Related: `NOTIFICATION_ESCALATION_SPECIFICATION.md`, `GRACE_PERIOD_SPECIFICATION.md`.

---

## Entry point

| Item | Detail |
|------|--------|
| Function | `processPaymentNotificationJobs(referenceDate?: string)` |
| Module | `packages/domain/src/modules/notifications/payment-scheduler.service.ts` |
| Default date | UTC calendar `today` when `referenceDate` omitted |
| Export | Also re-exported from `@wilms/domain` for in-process callers |

---

## Daily job behaviour

On each successful run the scheduler:

1. Loads system settings (`paymentReminderDaysBefore`, `latePaymentGraceDays`, SMS gates).
2. Lists **ACTIVE** loans with positive balance.
3. For each loan schedule:
   - Emits **due soon** for `PENDING` weeks with `dueDate = referenceDate + reminderLead`.
   - Emits **due today** for `PENDING` weeks with `dueDate = referenceDate`.
   - Runs **`applyMissedWeekMarking`** with `latePaymentGraceDays`.
   - Emits **missed** notifications for newly marked weeks.
   - Emits **overdue ladder** notifications at day offsets `1`, `G`, `G+1`, `G+2`, `7`.
4. If any newly missed events occurred, emits an **admin missed summary**.
5. Invokes operational notification jobs (`processOperationalNotificationJobs`) in the same pass.
6. Records run state via `recordSchedulerRun` (`kind: payment_notifications`).

Result counters include: `activeLoansScanned`, `remindersSent`, `dueTodaySent`, `missedNotificationsSent`, `overdueLadderSent`, skip counts, `errors`, `durationMs`, `correlationId`.

---

## Idempotency

| Layer | Guarantee |
|-------|-----------|
| Delivery dedupe | Unique `notification_delivery_records` keys prevent duplicate SMS / in-app for the same event |
| Schedule marking | `applyMissedWeekMarking` only transitions `PENDING` → `MISSED`; already missed weeks are inert |
| Safe rerun | Cron may POST more than once per day; emitters no-op on duplicate keys |
| Partial failure | Per-loan errors are collected; other loans continue |

The scheduler is **idempotent with respect to notification side effects**, provided dedupe storage is available. It is not a transactional saga across all loans.

---

## Cron HTTP route

| Item | Detail |
|------|--------|
| Method / path | `POST /notifications/scheduler/run` |
| Router | `packages/domain/src/modules/scheduler/public-routes.ts` (`publicSchedulerRouter`) |
| Auth | `requireSchedulerAccess` — bearer / `x-wilms-scheduler-token` via `WILMS_SCHEDULER_TOKEN`, or session with manage-communication-scheduler privilege |
| Body | Optional `{ "referenceDate": "YYYY-MM-DD" }` for replay / backfill |
| Response | Scheduler result payload (`sendData`) |

Mounting note: public scheduler routes are registered **before** blanket `requireAuth` so external cron can authenticate with the scheduler token without a browser session.

Sibling cron routes (same router, out of scope for payment ladder details):

| Path | Purpose |
|------|---------|
| `POST /automation/scheduler/run` | Daily automation pass |
| `POST /communications/scheduler/run` | Scheduled communications dispatch |

---

## Operational requirements

| Requirement | Detail |
|-------------|--------|
| Database | Requires `DATABASE_URL`; otherwise returns blocked result with error |
| External cron | Platform cron (or operator) must call the route on a daily cadence (programme typically morning local time) |
| Secrets | `WILMS_SCHEDULER_TOKEN` must be set in production for token auth |
| Observability | Structured logs `scheduler.payment_notifications.*` + run-state summary |
| Failure alert | Top-level failure triggers `emitSchedulerFailureAlert`; ops sub-pass failures are recorded separately |

---

## Extension rules (v1.8.0)

When extending escalation behaviour:

1. Prefer adjusting day-offset matching and emitter copy inside the existing pass.
2. Keep new notification types behind the same dedupe infrastructure.
3. Do not add a second payment cron path that double-scans active loans.
4. Preserve optional `referenceDate` for certification and dry-run evidence.

---

## Source of truth

| Area | Path |
|------|------|
| Job implementation | `packages/domain/src/modules/notifications/payment-scheduler.service.ts` |
| Public cron routes | `packages/domain/src/modules/scheduler/public-routes.ts` |
| Access middleware | `packages/domain/src/middleware/require-scheduler-access.ts` |
| Scheduler token env | `packages/domain/src/config/env.ts` (`WILMS_SCHEDULER_TOKEN`) |

---

*End of scheduler extension specification — WILMS 1.8.0*
