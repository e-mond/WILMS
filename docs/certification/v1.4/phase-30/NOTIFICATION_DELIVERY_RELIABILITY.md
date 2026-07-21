# Notification Delivery Reliability

**Version:** 1.4.2 | **Phase:** 30

## Deduplication

Unique constraint: `(dedupe_key, recipient, channel)` on `notification_delivery_records`.

In-memory fallback when `DATABASE_URL` unset (development/tests).

## Scheduler

- Endpoint: `POST /notifications/scheduler/run`
- Permission: `manage-communication-scheduler`
- Safe to rerun: duplicate logical events suppressed
- **Not durable**: requires external cron

Recommended cron: daily at 06:00 UTC (adjust for Ghana operations).

```bash
curl -X POST "$WILMS_API_URL/notifications/scheduler/run" \
  -H "Cookie: wilms_session=..." \
  -H "Content-Type: application/json"
```

Optional body: `{ "referenceDate": "2026-05-15" }` for backfill/testing.

## Provider failures

SMS/email failures logged to `message_deliveries` and `notification_delivery_records.status = FAILED`. Financial transactions unaffected.

## Queue reality

Mail/SMS from payment notifications still dispatch synchronously. BullMQ path exists for future async migration.

## Metrics

Prometheus counters on `/ops/metrics`: `wilms_notifications_*`
