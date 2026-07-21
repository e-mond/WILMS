# Notification Event Catalog

**Version:** 1.4.2 | **Phase:** 30

## Payment communication events (Phase 30)

| Type | Dedupe key | Channels | Mandatory | Recipients |
|------|------------|----------|-----------|------------|
| `PAYMENT_DUE_SOON` | `payment-due-soon:{loanId}:{dueDate}` | SMS, Email | Yes (borrower) | Borrower |
| `PAYMENT_MISSED` | `payment-missed:{loanId}:{dueDate}` | SMS, In-app | Yes | Borrower, assigned collector |
| `PAYMENT_CONFIRMED` | `payment-confirmed:{paymentId}` | SMS, Email, In-app | Yes | Borrower, recording collector |
| `ADMIN_MISSED_SUMMARY` | `admin-missed-summary:{date}` | In-app | Yes (ops) | Super Admin users |

## Trigger sources

| Event | Trigger |
|-------|---------|
| Payment due soon | Scheduler: pending schedule week where `dueDate = today + paymentReminderDaysBefore` |
| Payment missed | Scheduler: `applyMissedWeekMarking` returns newly missed week |
| Payment confirmed | `payments/service.ts` after successful `postPayment` transaction |
| Admin summary | Scheduler end when any missed events processed |

## Preference policy

| Category | User can disable? |
|----------|-------------------|
| Payment confirmation | No (mandatory financial) |
| Missed payment | No (mandatory financial) |
| Payment reminder | Reminder category (staff users); borrower SMS always sent when system SMS enabled |
| Marketing | Yes |

Staff in-app notifications respect `inAppEnabled` via existing preference service for non-mandatory categories.

## Legacy events

See `notification_event` enum (24 values) in `apps/backend/src/db/schema/enums.ts` for registration, loan lifecycle, auth, and communication broadcast events.
