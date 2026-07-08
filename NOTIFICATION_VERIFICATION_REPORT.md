# Notification Verification Report — v1.2.3

## Channels

| Channel | Status | Notes |
|---------|--------|-------|
| Email | Verified | Gmail SMTP via Vercel relay; `WILMS - GH` sender name |
| SMS | Verified | Twilio / Arkesel / SMSNotifyGH adapters |
| In-app | Verified | `createInAppNotification()` on domain events |
| Push | Verified | Web push subscriptions; purged on user deletion |

## Invitation Notifications

- Email: synchronous dispatch with delivery logging
- SMS: retried delivery with failure reason persistence
- In-app: welcome notification on invite

## Domain Events

Event dispatch in `event-dispatch.ts` covers registrations, loans, payments, collections, user lifecycle, and communication campaigns. Delivery analytics available in Communication Center.

## Retry & History

- SMS: up to 2 retries with 750ms backoff
- Email: configurable via `dispatchMail` retry policy
- History: `message_deliveries` and in-app `notifications` tables
