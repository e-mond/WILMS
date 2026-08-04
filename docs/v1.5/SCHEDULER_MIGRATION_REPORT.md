# Scheduler Migration Report — v1.5.0

## Before

GitHub Actions workflow `notification-scheduler.yml` posted daily at `0 6 * * *` to the Railway API with `WILMS_SCHEDULER_TOKEN`.

## After

Vercel Cron invokes `GET /api/cron/notifications` on the same schedule (`0 6 * * *` UTC), running:

1. `processPaymentNotificationJobs`
2. `processScheduledMessages`

Auth accepts `WILMS_SCHEDULER_TOKEN` or `CRON_SECRET` bearer tokens.

## Preservation

- Due-soon / missed-payment / confirmation flows remain in domain services
- Notification deduplication unchanged
- Audit / scheduler run recording unchanged for Express POST paths; cron path returns combined JSON summary

## Plan granularity

Vercel Pro supports cron down to every minute. Current product cadence is **daily**; no sub-daily requirement exists. If sub-daily reminders are added later, update `vercel.json` crons accordingly (Pro required under one hour).

## GitHub Actions

Schedule trigger is **disabled** (workflow_dispatch retained for rollback/manual runs). Re-enable only if reverting traffic to a Node API process.
