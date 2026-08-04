# Push Notification Report — v1.2.0

## Overview

Browser push notifications are implemented with Web Push subscriptions stored in `push_subscriptions`.

## Backend

- `POST /notifications/push/subscribe` — save subscription (endpoint unique)
- `POST /notifications/push/unsubscribe` — remove subscription
- `GET /notifications/push/vapid-public-key` — public VAPID key for client
- `sendPushToUser()` in `push.service.ts` — sends when `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` configured
- Communication broadcasts trigger push when user preferences allow

## Frontend

- `public/sw.js` — push + notificationclick handlers
- `PushSubscribePrompt` — permission + subscribe flow in settings
- Categories supported via payload: loan, payment, approval, registration, broadcast, announcement, maintenance, user

## Configuration

```env
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@wilms.org
```

## Mobile compatibility

Subscriptions use standard Web Push (P256DH + auth). Future native apps can reuse the same backend endpoints.

## Status

✅ Schema, API, service worker, preferences integration, and broadcast hooks operational.
