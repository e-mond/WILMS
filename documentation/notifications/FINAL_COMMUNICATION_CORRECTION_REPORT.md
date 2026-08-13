# Final Communication Correction Report

**Product version:** 1.8.0 (unchanged)  
**Branch:** `feature/v1.8.0-borrower-communication-correction`  
**Date:** 13 August 2026  
**Language:** British English

## What was corrected

Borrower SMS and related emitters now follow the real WILMS sequence: registration → approval (group + collector already assigned) → loan created → loan approved **with admin-fee instruction** → admin fee receipt (disbursement preparation) → disbursement → schedule → automatic reminders → missed / grace / escalation → loan completion → collector / group / payment-day changes.

Admin fee is no longer required to **create** or **approve** a loan. It remains required to **disburse**.

## UI (screenshots)

- Community/suburb autocomplete dropdown uses opaque `bg-card` and `z-50`.
- Business address and home address textareas use stronger card contrast (`--color-card: #262626` in executive-content dark theme).

## Templates updated

`packages/domain/src/infrastructure/notifications/templates.ts` — all 18 borrower SMS bodies plus loan-approval email admin-fee copy.

## Emitters updated

| Emitter / call site | Change |
|---------------------|--------|
| `event-dispatch.ts` | New `notifyLoanCreated`, `notifyCollectorReassignedToBorrower`; loan approval/disbursement/completion SMS |
| `borrowers/service.ts` | Registration reference; approval SMS after group assignment with collector name |
| `loans/service.ts` | `notifyLoanCreated`; admin-fee gate on disbursement only; approval SMS includes fee; disbursement includes group/collector/first due |
| `payments/service.ts` | One multi-week SMS when `weeksCount > 1`; completion uses final payment amount |
| `groups/service.ts` | Transfer → `notifyGroupAssigned`; collector reassign → borrower SMS |
| `admin-fee-notifications.ts` | Disbursement-preparation copy |
| `payment-notifications.ts` | T−1 / due-today / missed / grace / escalation builders; due-today has no email |
| `ops-notifications.ts` | Payment-day-changed SMS |
| `enterprise/service.ts` | Passes payment day and weekly amount into schedule-change notification |

## Scheduler

No new cron. Existing daily job at **06:00 UTC** (`vercel.json` → `/api/cron/notifications`) still sends T−1 reminder, due today, missed, grace, and escalation, with existing dedupe keys. Timing documented in `SCHEDULER_NOTIFICATION_TIMING.md`.

## Tests

- Domain: 301 passed  
- Frontend: 549 passed (277 + 272)  
- Type-check, lint, and production build: passed  

## Remaining gaps

1. **Borrower in-app/push inbox** — borrowers do not have WILMS user accounts. In-app and push for these events go to collector / officer / Super Admin. SMS remains the borrower channel.  
2. **Due-today and grace email** — omitted by design (channel matrix).  
3. **Live end-to-end SMS provider run** — not executed in this sprint (unit/wiring tests only). Confirm Arkesel/Twilio/SMSNotifyGH in staging before merge if production SMS is already live.  
4. **Loan-created in-app** — SMS/email only unless a collector user id is later passed in.

## Merge recommendation

Safe to merge into `main` after a staging SMS smoke (registration submit, loan approve, one reminder cycle). Do not bump the application version; remain on **v1.8.0**.
