# WILMS v1.7.5 — Push Notifications Report

## Status

Complete — Phase C.

## Delivered

- VAPID remains optional: `sendPushToUser` and vapid-public-key route degrade gracefully when unset
- Push triggers for holiday request submit/decision/apply and offline sync conflict queueing
- Existing recon/ops/comms push paths retained
- `PushSubscribePrompt` explains missing VAPID and requests permission explicitly
- SW `notificationclick` navigates to payload URL when possible
- Notification inbox uses IndexedDB snapshot fallback offline

## Environment

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@wilms.org
```
