# Final Operations Audit

**Version:** 1.4.2 | **Phase:** 31

## Queue reality

In-process default; BullMQ when Redis + flag. Schedulers are **HTTP-triggered**.

## Cron

| Method | Status |
|--------|--------|
| Session+RBAC | ✓ |
| `WILMS_SCHEDULER_TOKEN` | ✓ Phase 31 |
| GitHub Actions workflow | ✓ example (requires secrets) |
| Railway native cron | External — operator configures URL+token |

## Observability

- Structured logs with requestId + correlationId
- `/ops/status` includes `workers.lastRuns` + `schedulerTokenConfigured`
- Prometheus: `wilms_scheduler_*`, `wilms_notifications_*`

## Status

**PASS (code-level)** | Live cron evidence **BLOCKED** until secrets configured and first successful run attached.
