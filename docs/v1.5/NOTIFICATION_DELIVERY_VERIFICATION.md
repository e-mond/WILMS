# Notification Delivery Verification (v1.4.3)

## Admin fee confirmation (new)

| Channel | Behavior |
|---------|----------|
| SMS | Deduped `admin-fee-confirmed:{transactionId}`; template includes amount, optional LN- display ID, payment date |
| Email | Deduped per recipient when email notifications enabled |
| In-app | Collector notification (event `PAYMENT_RECEIVED` category) |
| Audit | `admin-fee.recorded` entry with amount/date/borrower |

Duplicate SMS is suppressed by `tryAcquireNotificationDelivery`.

## Existing financial events (verified by code path review)

| Event | Inbox | Push* | SMS | Email | Dedupe |
|-------|-------|-------|-----|-------|--------|
| Admin fee | Yes (collector) | Via in-app infra | Yes | Yes | Yes |
| Loan approval | Yes | — | Yes | Yes | Event dispatch |
| Disbursement | Yes | — | Yes | Yes | Event dispatch |
| Payment confirmation | Yes | — | Yes | Yes | `payment-confirmed:{id}` |
| Upcoming / missed payment | Scheduler | — | Yes | — | Date-scoped keys |
| Reconciliation submit | Ops/audit oriented | — | — | — | Idempotency key on submit |

\*Push delivery depends on VAPID configuration in the environment.

## Residual risks

- SMS/email only deliver when providers and settings flags are enabled.
- Loan approval/disbursement paths still use lighter event-dispatch SMS (without the payment dedupe table); admin fee and payments use the stronger dedupe layer.
