# Email Tracking Report — v1.2.0

## Open tracking

- 1×1 transparent GIF injected into all outbound HTML emails
- URL: `{WILMS_APP_URL}/api/t/o/{trackingToken}.gif`
- Records: `opened_at`, `first_opened_at`, `open_count`, device, user agent, IP
- Events stored in `email_tracking_events` (type `OPEN`)

## Click tracking

- All `<a href>` links rewritten through tracking endpoint
- URL: `{WILMS_APP_URL}/api/t/c/{token}/{linkId}?url={destination}`
- Records: link ID, destination, timestamp, delivery association
- Updates `click_count`, `clicked_at` on `message_deliveries`

## Analytics

`GET /communications/analytics` now includes:

- Open rate, click rate (CTR), delivery rate, bounce rate
- Time series (sent/opened/clicked/failed per day)
- Top recipients and top campaigns

## Frontend proxy routes

- `apps/frontend/src/app/api/t/o/[token]/route.ts`
- `apps/frontend/src/app/api/t/c/[token]/[linkId]/route.ts`

## Status

✅ Pixel, click redirect, event logging, and dashboard analytics operational.
