# Borrower Communication Audit

**Product version:** 1.8.0  
**Branch:** `feature/v1.8.0-borrower-communication-correction`  
**Language:** British English  
**Scope:** Factual inventory of the existing notification system before correction. No business rules invented.

## Authority for this sprint

Correct lifecycle (product):

1. Registration submitted → 2. Registration approved (group + collector assigned) → 3. Loan created → 4. Loan approved (admin-fee instruction) → 5. Admin fee paid → 6. Loan disbursed → 7. Schedule issued → 8–14. Reminder / due / payment / missed / grace / escalation → 15. Loan completed → plus collector / group / payment-day changes.

## Code map

| Area | Path |
|------|------|
| SMS / email templates | `packages/domain/src/infrastructure/notifications/templates.ts` |
| Lifecycle dispatch | `packages/domain/src/infrastructure/notifications/event-dispatch.ts` |
| Payment ladder | `packages/domain/src/infrastructure/notifications/payment-notifications.ts` |
| Admin fee | `packages/domain/src/infrastructure/notifications/admin-fee-notifications.ts` |
| Schedule change | `packages/domain/src/infrastructure/notifications/ops-notifications.ts` |
| In-app + push mirror | `packages/domain/src/infrastructure/notifications/in-app-notify.ts` |
| Dedupe | `packages/domain/src/infrastructure/notifications/notification-dedupe.ts` |
| Payment scheduler | `packages/domain/src/modules/notifications/payment-scheduler.service.ts` |
| Cron entry | `apps/frontend/src/app/api/cron/notifications/route.ts` + `vercel.json` (`0 6 * * *` UTC) |
| SMS providers | `packages/domain/src/infrastructure/sms/` (Arkesel, Twilio, SMSNotifyGH) |

## Current borrower SMS copy (as coded)

| Event | Current SMS (summary) | Correct? |
|-------|----------------------|----------|
| Registration submitted | `WILMS: Hi {name}, we received your registration…` | Needs professional rewrite + reference |
| Registration approved | `…approved` + call-site next step says group assignment happens **later** | **Incorrect** — group/collector already assigned |
| Loan created | **None** | Missing |
| Loan approved | Approval only; **no admin-fee instruction** | Incomplete |
| Admin fee | Receipt; copy says can proceed to **approval** | **Incorrect** — fee is post-approval, pre-disbursement |
| Disbursed | Short disbursement SMS | Incomplete (first due date) |
| Schedule issued | Second SMS at disbursement | Needs group/collector/weekly detail rewrite |
| Reminder T−1 | Due tomorrow | Needs group/collector rewrite |
| Due today | Exists | Needs rewrite |
| Payment received | Receipt | Needs rewrite |
| Multi-week payment | Same emitter × N weekly rows | Missing dedicated message |
| Missed | Exists (manual / post-grace auto) | Needs rewrite; same-day auto gap |
| Grace | Ladder at `latePaymentGraceDays` | Needs rewrite |
| Escalation | Ladder at ≥7 days | Needs rewrite |
| Loan completed | **Email only** | Missing SMS |
| Collector changed | Staff only | Missing borrower SMS |
| Group transfer | Staff only | Missing borrower SMS |
| Payment day changed | Exists | Needs rewrite |

## Channel matrix (as implemented today)

| Event | SMS | Email | In-app | Push |
|-------|:---:|:-----:|:------:|:----:|
| Registration submitted | ✓ | ✓ | Staff | Staff mirror |
| Registration approved | ✓* | ✓* | — | — |
| Loan created | — | — | — | — |
| Loan approved | ✓ | ✓ | —† | — |
| Admin fee | ✓ | ✓ | Staff | Staff |
| Disbursed | ✓ | ✓ | Staff | Staff |
| Schedule | ✓ | — | — | — |
| Reminder / due today | ✓ | ✓ | — | — |
| Payment received | ✓ | ✓ | Staff | Staff |
| Missed / grace / escalation | ✓‡ | — | Staff | Staff |
| Loan completed | — | ✓ | Staff | Staff |
| Collector / group change | — | — | Staff | Staff |
| Payment day changed | ✓ | ✓ | — | — |

\*Gated on phone present for approve path.  
†Emitter supports collector in-app but approve call site does not pass collector user id.  
‡Also gated by `missedPaymentSmsEnabled`.

## Scheduler timing (existing)

| Job | Schedule | Behaviour |
|-----|----------|-----------|
| Vercel cron `/api/cron/notifications` | `0 6 * * *` UTC | Runs payment notification job then communications dispatch |
| Due soon | Same daily pass | `paymentReminderDaysBefore` (default **1**) |
| Due today | Same daily pass | Same calendar day as due date |
| Missed auto-mark | After grace | `dueDate + latePaymentGraceDays < today` |
| Grace SMS | Ladder day = grace days | Default grace **3** |
| Escalation SMS | Ladder day ≥ **7** | Borrower SMS + staff in-app |

Idempotency: `notification_delivery_records` unique on `(dedupeKey, recipient, channel)`.

## Gaps driving Phase 2+

1. Replace all borrower SMS (and matching email bodies where required) with the sprint’s British English templates.
2. Fix registration-approved messaging to include **Group** and **Collector** (already assigned).
3. Move admin-fee instruction to **loan approved**; correct admin-fee receipt wording for pre-disbursement.
4. Add emitters: loan created, multi-week payment, loan completed SMS, collector/group reassignment (borrower), payment-day change copy.
5. Align channel matrix with the sprint table (quiet hours + preferences retained).
6. Keep scheduler automatic for T−1, due today, missed, grace, escalation without duplicate sends.

## Out of scope

GIS, maps, territory intelligence, and product version bumps.
