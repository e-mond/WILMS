# Notification Operations Runbook

**Version:** 1.4.2 | **Phase:** 30

## Daily scheduler

1. Configure cron to POST `/notifications/scheduler/run` once daily (recommended 06:00 UTC).
2. Use a service account with `manage-communication-scheduler` permission.
3. Verify response JSON: `remindersSent`, `missedNotificationsSent`, `errors`.

## Monitor failures

```bash
# Delivery logs (admin UI or API)
GET /communications/delivery-logs

# Prometheus
curl -H "Authorization: Bearer $WILMS_METRICS_TOKEN" $API/ops/metrics | grep wilms_notifications
```

## Disable channels

System settings: `smsNotificationsEnabled`, `emailNotificationsEnabled`, `missedPaymentSmsEnabled`.

User preferences: staff in-app/email/SMS toggles (mandatory payment events still sent to borrowers when system SMS enabled).

## Provider configuration

| Channel | Env vars |
|---------|----------|
| Email | `MAIL_PROVIDER`, `RESEND_API_KEY`, or SMTP / Vercel relay |
| SMS | Provider-specific (`ARKESEL_*`, `TWILIO_*`, etc.) |

## Troubleshooting

| Symptom | Check |
|---------|-------|
| No reminders | Cron hitting scheduler? `paymentReminderDaysBefore` setting? Active loans with PENDING weeks? |
| Duplicate SMS | Should not occur — check `notification_delivery_records` for duplicate key violations |
| Collector not notified | Borrower assigned to group with `collector_user_id`? |
| Scheduler errors | API logs; `errors` array in scheduler response |

## Scheduler unavailable

Missed marking still occurs when collectors open payment entry (`getPaymentEntryContext`). Notifications queue until next successful scheduler run (dedupe prevents backlog duplicates).
