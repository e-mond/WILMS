# WILMS v1.1.2 — SMS Delivery Report

**Branch:** `hotfix/v1.1.2-user-management-notifications`  
**Version:** `1.1.2`  
**Date:** 2026-07-07

## Executive summary

SMS notification helpers existed but lacked persistent delivery logging and were not consistently wired to domain events. v1.1.2 adds `dispatchSms()` with graceful degradation, retries, and unified logging to `message_deliveries`.

## Root cause

| Symptom | Root cause |
|---------|------------|
| SMS delivery not auditable | No persistent log; failures not recorded |
| Inconsistent event wiring | SMS templates existed but not called from all service paths |
| Provider unavailable breaks flow risk | No graceful skip + log pattern |

## Architecture

```text
Domain service (borrowers, loans, payments)
  → event-dispatch.ts (dispatchSms)
       ├─ settings.smsNotificationsEnabled = false → skip
       ├─ provider not configured → log failure, continue
       ├─ provider.send() with retries (max 2)
       └─ logMessageDelivery(channel: SMS)
```

## Files modified

| File | Change |
|------|--------|
| `apps/backend/src/infrastructure/notifications/event-dispatch.ts` | **New** — `dispatchSms()` with retries, logging, graceful skip |
| `apps/backend/src/infrastructure/notifications/templates.ts` | SMS templates for loan, payment, registration events |
| `apps/backend/src/infrastructure/notifications/delivery-log.ts` | **New** — shared email/SMS delivery log |
| `apps/backend/src/modules/borrowers/service.ts` | Registration approve/reject/blacklist SMS |
| `apps/backend/src/modules/payments/service.ts` | Payment received, missed payment SMS |
| `apps/backend/src/modules/loans/service.ts` | Loan approved, disbursed SMS |

## SMS events wired (v1.1.2)

| Event | Template | Status |
|-------|----------|--------|
| Registration approved | `buildBorrowerRegistrationApprovalSmsBody` | ✅ Wired |
| Registration rejected | (rejection SMS body) | ✅ Wired |
| Borrower blacklisted | `buildBlacklistSmsBody` | ✅ Wired |
| Loan approved | `buildLoanApprovalSmsBody` | ✅ Wired |
| Loan rejected | `buildLoanRejectedSmsBody` | ✅ Template exists; service wiring pending |
| Loan disbursed | `buildLoanDisbursedSmsBody` | ✅ Wired |
| Payment received | `buildPaymentConfirmationSmsBody` | ✅ Wired |
| Missed payment | `buildMissedPaymentSmsBody` | ✅ Wired |
| Overdue reminder | — | ⏳ Scheduler not implemented |
| User invitation | — | ⏳ Optional; email only |
| Registration submitted | — | ⏳ Not wired |

## Graceful degradation

When SMS provider is unavailable or not configured:

1. `dispatchSms()` logs failure to `message_deliveries` with `success: false` and reason
2. Application flow continues — no thrown errors from SMS dispatch
3. Retries up to 2 attempts with 750ms backoff multiplier

When `smsNotificationsEnabled` is false in system settings, SMS dispatch is skipped entirely (no log entry).

## Database changes

Same `message_deliveries` table as email (migration `0014_v112_notifications.sql`), with `channel = 'SMS'`.

Logged fields per SMS:
- `recipient` (normalized Ghana phone)
- `provider`, `provider_message_id`
- `body_preview` (truncated to 500 chars)
- `success`, `failure_reason`, `retry_attempts`
- `borrower_id`, `loan_id`, `user_id`
- `created_at`

## APIs affected

No new public SMS endpoints. Delivery logs accessible via:

- `GET /settings/delivery-logs?event=<event>&recipient=<phone>`

## Verification evidence

| Check | Result |
|-------|--------|
| `templates.test.ts` | 6/6 PASS |
| `npm run test -w @wilms/api` | 53/53 PASS |
| `smoke:production` | 31/31 PASS |
| `smoke:rbac` | 11/11 PASS |

## Remaining issues

- Loan rejection SMS template exists but service path not yet wired
- Overdue/partial payment reminder SMS requires scheduler (not in v1.1.2 scope)
- Invitation SMS optional — not implemented
- Registration submitted SMS not wired
- Live SMS provider verification requires production Hubtel/Africa's Talking credentials
