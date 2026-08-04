# Security Report — v1.5.0

## Preserved controls

- HMAC session cookies (`wilms_session`)
- RBAC + permission overrides
- Maker-checker / separation of duties
- Idempotency keys on financial mutations
- CSRF on mutating same-origin API calls
- Request IDs
- Audit logging
- Upload validation
- Safe redirects
- Scheduler token auth

## Serverless rate limiting

| Limiter | Store |
|---|---|
| Global API (300/min) | Redis when `REDIS_URL` / `WILMS_REDIS_URL` set |
| Login | Redis-backed via shared factory |
| Invitation abuse | Redis-backed via shared factory |

**Production serverless:** `REDIS_URL` or `WILMS_REDIS_URL` is **required** (validated at bootstrap). In-memory limiters are unacceptable across isolated invocations.

## Error exposure

Domain/HTTP error mapper continues to hide stack traces, SQL, and ORM internals from clients.

## Secrets

Move all former Railway secrets to Vercel Preview + Production. Rotate `WILMS_SESSION_SECRET` only with a planned session invalidation window.
