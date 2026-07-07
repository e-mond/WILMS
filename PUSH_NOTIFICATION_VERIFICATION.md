# Push Notification Verification — v1.2.1

| Component | Status |
|-----------|--------|
| `push_subscriptions` schema | ✅ |
| Subscribe API | ✅ |
| Unsubscribe API | ✅ |
| VAPID public key endpoint | ✅ |
| Service worker (`public/sw.js`) | ✅ |
| Settings subscribe prompt | ✅ |
| User preference gates | ✅ |
| Broadcast push on send | ✅ |

## Configuration

Requires `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in production for live delivery.

## Status

✅ Infrastructure complete; delivery requires VAPID env vars
