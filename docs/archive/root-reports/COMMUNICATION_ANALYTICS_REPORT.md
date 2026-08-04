# WILMS v1.1.3 — Communication Analytics Report

**Version:** `1.1.3`

## Analytics dashboard

Available at Communication Center → Delivery Reports tab and via `GET /communications/analytics`.

### Metrics

| Metric | Source |
|--------|--------|
| Total sent | `message_deliveries` where success=true |
| Total failed | `message_deliveries` where success=false |
| Total pending | `message_deliveries` where status=PENDING |
| Email count | channel=EMAIL |
| SMS count | channel=SMS |
| Success rate | sent / total × 100 |
| Open rate | opened_at not null / total × 100 |
| Click rate | clicked_at not null / total × 100 |

### Failed messages

`GET /communications/failed` returns recent failures with:
- event, channel, recipient
- failure_reason, retry_attempts
- created_at

### Searchable delivery logs

`GET /communications/delivery-logs?q=<query>` searches recipient, event, and subject fields.

### Scheduler

`POST /communications/scheduler/run` processes messages with status=SCHEDULED and scheduled_at <= now.

Supports scheduling via `scheduledAt` on message creation.

## Export

Delivery logs are exportable via the Communication Center UI (CSV export via existing report infrastructure — manual copy from table for v1.1.3).

## Future enhancements

- Provider webhook integration for real open/click tracking
- PDF/Excel export of analytics
- Time-series charts for delivery trends
