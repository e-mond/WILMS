# Final Operations Audit

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

## Health & Observability

| Component | Status |
|-----------|--------|
| `/health` endpoint | ✓ tested |
| Migration watermark in health | ✓ |
| Request IDs | ✓ |
| Structured JSON logs | ✓ |
| Prometheus metrics (`/ops/metrics`) | ✓ token-gated |
| Graceful shutdown | ✓ |

## Queue Reality

| Mode | When | Durability |
|------|------|------------|
| In-process queue | Default (no Redis) | **Not durable** — single instance only |
| BullMQ + Redis | `REDIS_URL` set | Durable jobs |

**Do not claim durable background processing without Redis.**

## Multi-Instance Safety

| Concern | Without Redis | With Redis |
|---------|---------------|------------|
| Rate limits | Per-instance | Distributed |
| Job deduplication | None | BullMQ |
| Scheduled job duplication | **Risk** | Mitigated |

## Email / SMS

Queued via platform queue. Failures logged. Live delivery verification **BLOCKED** — requires provider credentials on staging.

## File Storage

Cloudinary when `CLOUDINARY_URL` set. Upload verification **BLOCKED** on staging.

## Environment Validation

Startup validates `WILMS_SESSION_SECRET`, database URL format, and production demo guards.

## Operator Scripts

| Script | Purpose |
|--------|---------|
| `npm run verify:phase29` | All automated gates |
| `scripts/operator/run-staging-gates.sh` | Staging smoke + RBAC |
| `npm run drill:backup-restore` | DR drill |

## Status

**PASS (code-level)** | Monitoring / mail / SMS live verify **BLOCKED**
