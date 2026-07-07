# Webhook Integration Report — v1.2.0

## Endpoints

| Endpoint | Provider | Auth |
|----------|----------|------|
| `POST /webhooks/mail/resend` | Resend | HMAC SHA-256 (`RESEND_WEBHOOK_SECRET`) |
| `POST /webhooks/mail/generic` | SMTP, SendGrid, Mailgun, SES, Postmark | Payload mapping |

## Events mapped

- `DELIVERED` → `delivered_at`, `success=true`
- `BOUNCED` → `bounced_at`, `bounce_reason`
- `COMPLAINED` → `complained_at`
- `FAILED` → `failure_reason`
- `DEFERRED` → status update

## Generic webhook payload

```json
{
  "provider": "sendgrid",
  "messageId": "provider-msg-id",
  "event": "delivered",
  "reason": "optional"
}
```

## Delivery lookup

Webhooks match `provider_message_id` on `message_deliveries` and update status automatically.

## Status

✅ Resend + generic receivers mounted at app root (no auth required). Signature verification when secret configured.
