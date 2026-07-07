# WILMS v1.1.3 — Message Delivery Report

**Version:** `1.1.3`

## Delivery infrastructure

### Channels
- **Email** — `dispatchMail()` with Vercel relay (from v1.1.2)
- **SMS** — `dispatchSms()` with retry and graceful degradation
- **In-App** — `createInAppNotification()` to `notifications` table

### Tracking (`message_deliveries`)

| Field | v1.1.2 | v1.1.3 |
|-------|--------|--------|
| recipient, channel, event | ✅ | ✅ |
| provider, message_id | ✅ | ✅ |
| success, failure_reason, retry_attempts | ✅ | ✅ |
| status | — | ✅ SENT/PENDING/FAILED |
| opened_at, clicked_at | — | ✅ (webhook-ready) |
| bounce_reason | — | ✅ |
| communication_message_id | — | ✅ |

### Events wired (complete list)

| Event | Email | SMS | In-App |
|-------|-------|-----|--------|
| USER_INVITED | ✅ | — | ✅ |
| USER_WELCOME | ✅ | — | — |
| PASSWORD_RESET | ✅ | — | — |
| USER_ACTIVATED/ENABLED/DISABLED | ✅ | — | ✅ |
| ROLE_CHANGED | ✅ | — | ✅ |
| REGISTRATION_APPROVED/REJECTED | ✅ | ✅ | — |
| BORROWER_BLACKLISTED | — | ✅ | — |
| LOAN_APPROVED/REJECTED/DISBURSED | ✅ | ✅ | ✅ |
| LOAN_COMPLETED | ✅ | — | ✅ |
| LOAN_CLOSED/DEFAULT | ✅ | — | ✅ |
| PAYMENT_RECEIVED | ✅ | ✅ | ✅ |
| PAYMENT_REVERSAL | ✅ | — | — |
| MISSED_PAYMENT | — | ✅ | — |
| PAYMENT/COLLECTION_REMINDER | ✅ | ✅ | — |
| GROUP_CREATED | ✅ | — | ✅ |
| COLLECTOR_ASSIGNED | ✅ | — | ✅ |
| COMMUNICATION (broadcast) | ✅ | ✅ | ✅ |

## Communication Center broadcasts

`POST /communications/messages/:id/send` resolves audience and dispatches to all matching users across selected channels with per-recipient delivery logging.

## Retry policy

- Max 2 retries, 750ms exponential backoff
- SMS failures logged but never break application flow
- Email invitation failures throw (admin must know)
