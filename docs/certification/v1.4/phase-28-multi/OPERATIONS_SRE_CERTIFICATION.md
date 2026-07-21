# Operations & SRE Certification

**Version:** 1.4.2 | **Date:** 2026-07-21

## Verified (Code)

| Control | Implementation |
|---------|----------------|
| Health endpoint | `GET /health` — excluded from rate limit |
| Request IDs | `requestIdMiddleware` |
| Metrics | `GET /ops/metrics` — permission-gated |
| Rate limiting | 300/min global; Redis when REDIS_URL set |
| Graceful errors | Global handler + sanitized BFF |
| Feature flags | Env-backed; outbox/queues Redis-dependent |

## Explicit Limitations (Not Hidden)

| Component | Durability |
|-----------|------------|
| In-process queue | **Not durable** — lost on restart |
| BullMQ + Redis | Durable when REDIS_URL configured |
| Rate limits (no Redis) | Per-instance only |
| Scheduler | In-process; no cross-instance guarantee |

## Live Ops Verification

**BLOCKED** — mail/SMS/storage/alerting require production config access.

## Status

Architecture documented honestly | Live ops **BLOCKED**
