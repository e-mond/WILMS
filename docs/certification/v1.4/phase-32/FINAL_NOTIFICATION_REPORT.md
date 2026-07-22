# Phase 32 — Final Notification Report

**Status:** Scheduler PASS (local) | Provider delivery BLOCKED

## Architecture

- Mail: Resend, SMTP/Gmail (via relay), configurable via `MAIL_PROVIDER`
- SMS: SMSNotifyGH, Arkesel, Twilio via `SMS_PROVIDER`
- Scheduler: HTTP POST with `WILMS_SCHEDULER_TOKEN`
- Dedupe: `unique(dedupe_key, recipient, channel)` on `notification_delivery_records`

## G5 evidence

Local fallback verified:
- Invalid token rejected (401)
- Valid token accepted (200)
- Duplicate run idempotent (200)

Evidence: `evidence/operator/notification-scheduler.json`

## Blocked

- Staging scheduler with PostgreSQL (notifications require DB)
- Live mail/SMS delivery receipts (G6)
