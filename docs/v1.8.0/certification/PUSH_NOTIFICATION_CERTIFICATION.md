# WILMS v1.8.0 — Push Notification Certification

**Generated (UTC):** 2026-08-09T19:25:00Z

## Verdict

**BLOCKED — not PASS**

Cannot claim device delivery from production. Operator stated VAPID keys are configured in Vercel; this agent could **not** open an authenticated browser session against production or observe a real OS/browser push.

## Checklist (evidence-based)

| # | Test | Status | Evidence / blocker |
|---|------|--------|-------------------|
| 1 | Browser subscription | BLOCKED | Needs logged-in browser + Notification permission |
| 2 | Permission prompt | BLOCKED | Interactive UI required |
| 3 | VAPID registration | BLOCKED | Unauthenticated `GET …/vapid-public-key` → 401 (`evidence/vapid-body.json`); route behind `requireAuth` |
| 4 | Subscription persistence | BLOCKED | Needs authenticated POST `/notifications/push/subscribe` |
| 5 | In-app notification creation | UNIT PASS only | `in-app-mirrors-push.test.ts` (memory DB) — not production |
| 6 | Push dispatch | UNIT PASS only | Preference gate + mirror call mocked/unit |
| 7 | Device delivery | **BLOCKED** | No browser/device receipt captured |
| 8 | Click behaviour | BLOCKED | No payload click evidence |
| 9 | Deep linking | BLOCKED | No production payload `url` click |
| 10 | Duplicate prevention | UNIT/code review only | Dedupe service exists; not production-proved for push |
| 11 | Quiet hours | UNIT/code review only | `shouldSendChannel` quiet-hour logic |
| 12 | Re-subscription | BLOCKED | |
| 13 | Expired subscription handling | CODE ONLY | `sendPushToUser` removes 404/410 endpoints |
| 14 | Multiple device subscriptions | BLOCKED | |

## Production health signal

`integrations.notifications.push` = `"optional"` in `evidence/health.json`. Does **not** prove VAPID private/public are set; only that push is not required for health OK.

## What is required to close to PASS

1. `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD` (or interactive login) on https://wilms.vercel.app  
2. Enable notifications in browser; complete `PushSubscribePrompt`  
3. Capture: DevTools Application → Push subscription endpoint; network subscribe 200; screenshot of OS notification from a triggered in-app event  
4. Record timestamp, request id, payload JSON, and that click opens expected deep link  
5. Optionally confirm `VAPID_PUBLIC_KEY` non-null via authenticated vapid endpoint  

## Unit evidence (not production delivery)

- `evidence/financial-rbac-push-unit.log` / domain suites: push preference skip + in-app mirrors push
