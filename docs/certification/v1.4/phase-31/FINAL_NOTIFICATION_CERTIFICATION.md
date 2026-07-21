# Final Notification Certification

**Version:** 1.4.2 | **Phase:** 31

## Events

| Event | Dedupe | Channels |
|-------|--------|----------|
| Due soon | `payment-due-soon:{loanId}:{dueDate}` | SMS, Email |
| Missed | `payment-missed:{loanId}:{dueDate}` | SMS, Collector in-app |
| Confirmed | `payment-confirmed:{paymentId}` | SMS, Email, Collector in-app |
| Admin summary | `admin-missed-summary:{date}` | Super Admin in-app |

## Scheduler

- Endpoint: `POST /notifications/scheduler/run`
- Auth: `WILMS_SCHEDULER_TOKEN` **or** session+permission
- Workflow: `.github/workflows/notification-scheduler.yml`
- Ops: last-run snapshot + Prometheus gauges
- Reality: HTTP-triggered; not Redis durable cron

## Mail / SMS

| Channel | Providers | Delivery claim |
|---------|-----------|----------------|
| Email | Resend / SMTP / Vercel relay | Best-effort after commit |
| SMS | Arkesel / Twilio / SMSNotifyGH | Best-effort after commit |

Created ≠ queued ≠ provider-accepted ≠ delivered.

## Live provider evidence

**BLOCKED**
