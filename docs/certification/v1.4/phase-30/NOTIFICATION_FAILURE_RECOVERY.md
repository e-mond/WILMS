# Notification Failure Recovery

**Version:** 1.4.2 | **Phase:** 30

## Failure modes

| Failure | Behaviour |
|---------|-----------|
| SMS provider down | Delivery record `FAILED`; payment still committed |
| Email provider down | Delivery record `FAILED`; payment still committed |
| Scheduler not run | No reminders until next successful cron; marking still on payment context |
| Duplicate scheduler run | Unique constraint blocks duplicate deliveries |
| Partial channel success | Each channel has separate dedupe slot |

## Operator recovery

1. Check `/ops/metrics` for `wilms_notifications_failed`
2. Review `/communications/delivery-logs`
3. Re-run `POST /notifications/scheduler/run` (safe — idempotent)
4. Do not manually insert duplicate notification rows

## User-facing messages

Never expose SQL, stack traces, or provider raw errors. Inbox load failures show friendly retry copy via QueryStatePanel patterns.
