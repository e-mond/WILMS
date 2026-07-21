# API Rate Limiting Report — Phase 27

## Implementation

| Limiter | Window | Max | Store |
|---------|--------|-----|-------|
| Global API (`createApiRateLimiter`) | 1 min | 300 / IP | Redis if `REDIS_URL`, else memory |
| Login | 15 min | 20 | Memory (existing) |
| Forgot / reset / OTP | existing | existing | Memory |
| Accept invitation | 15 min | 20 | Memory |

## HTTP behaviour

- Status **429**
- `standardHeaders: true` (RateLimit-* / Retry-After via express-rate-limit)
- Body: `{ error: { message, code: "RATE_LIMITED" } }`
- Skips `/health` and `/ops/metrics`

## Production limitations

Without Redis, limits are **per process** — multi-instance deployments should set `REDIS_URL` / `WILMS_REDIS_URL` for shared protection (same requirement as durable queues).
