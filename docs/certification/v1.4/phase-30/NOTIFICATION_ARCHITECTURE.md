# Notification Architecture

**Version:** 1.4.2 | **Phase:** 30

## Overview

WILMS notification delivery follows a decoupled event pipeline:

```text
Business event (payment committed, scheduler tick)
        ↓
Payment notification orchestrator (payment-notifications.ts)
        ↓
Idempotent delivery gate (notification-dedupe.ts)
        ↓
Channel dispatch (SMS / Email / In-app)
        ↓
Delivery log + metrics
```

Financial transactions **never** depend on notification provider availability. Notifications fire **after** payment commit via `void emitPaymentConfirmedNotification(...)`.

## Components

| Layer | Path | Role |
|-------|------|------|
| Dedupe store | `notification_delivery_records` table | Unique `(dedupe_key, recipient, channel)` |
| Orchestrator | `infrastructure/notifications/payment-notifications.ts` | Payment due/missed/confirmed |
| Scheduler | `modules/notifications/payment-scheduler.service.ts` | HTTP-triggered batch job |
| Legacy dispatch | `infrastructure/notifications/event-dispatch.ts` | Non-payment events; delegates payment events |
| In-app inbox | `modules/notifications/service.ts` | Per-user inbox API |
| Templates | `infrastructure/notifications/templates.ts` | Branded SMS/email bodies |
| Mail | Resend / SMTP / Vercel relay | `infrastructure/mail/` |
| SMS | Arkesel / Twilio / SMSNotifyGH | `infrastructure/sms/` |

## Scheduler reality

The payment notification scheduler is **HTTP-triggered** (`POST /notifications/scheduler/run`). It is idempotent and safe to rerun but is **not** a durable distributed cron. Operators must configure external cron (e.g. daily 06:00 UTC).

Without Redis/BullMQ job scheduling, do not claim durable background scheduling.

## Migration

Migration `0030_v142_notification_dedupe.sql` adds `notification_delivery_records` and optional `dedupe_key` on `notifications`.

## Future path

Wire `domain_outbox` from payment commits and route mail/SMS through BullMQ when `REDIS_URL` + `WILMS_FLAG_DURABLE_QUEUES` are enabled.
