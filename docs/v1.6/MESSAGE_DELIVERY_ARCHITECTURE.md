# Message Delivery Architecture (v1.6)

```text
Compose / Scheduler
        │
        ▼
resolveAudienceRecipients (users | borrowers | groups)
        │
        ▼
sendMessage / emit*Notification
        │
        ├── tryAcquireNotificationDelivery (dedupe)
        ├── shouldSendChannel (+ quiet hours)
        ├── EMAIL  → mail provider + delivery log
        ├── SMS    → SMS provider (phone) + delivery log
        ├── IN_APP → notifications table
        └── PUSH   → web-push subscriptions
```

## Key modules

- `packages/domain/src/modules/communications/audience.ts`
- `packages/domain/src/modules/communications/service.ts`
- `packages/domain/src/infrastructure/notifications/payment-notifications.ts`
- `packages/domain/src/infrastructure/notifications/ops-notifications.ts`
- `packages/domain/src/modules/notifications/preferences.service.ts`
- `packages/domain/src/modules/notifications/quiet-hours.ts`

## Idempotency

Broadcast send remains gated by message status + recurrence rules. Automated notifications use unique `(dedupe_key, recipient, channel)`.
