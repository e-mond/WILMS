# Phase 33 — Operations & Resilience Report

**Identity:** WILMS v1.8.0

## Scheduler / cron

| Check | Result |
|-------|--------|
| Valid `WILMS_SCHEDULER_TOKEN` | Accepted (scheduler-http suite) |
| Wrong token | 401 fail-closed (no session fallthrough) — H7 remediated |
| Missing token, no session | 401 via `requireAuth` |
| Missing `WILMS_SCHEDULER_TOKEN` env | Session + `MANAGE_COMMUNICATION_SCHEDULER` still allowed (by design) |

## Environment validation

| Check | Result |
|-------|--------|
| Production Node API without `WILMS_CORS_ORIGIN` | Error |
| Serverless production localhost/default CORS | Error (H4) |
| Redis unset | Warning (in-memory rate limits) |
| Session secret placeholder in production | Error |

## Notifications

Push provider soft-fail when VAPID unset remains intentional. Subscription spam capped (H8).

## Residuals (ops gates)

- Neon migrate through **0040**
- Production CORS / Redis / VAPID / scheduler token configured in deployment secrets
- DR URL drill / prod smoke credentials remain certification blockers (see FINAL_AUDIT_VERDICT)
