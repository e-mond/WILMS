# Webhook Verification — v1.2.1

| Endpoint | Provider | Events |
|----------|----------|--------|
| `POST /webhooks/mail/resend` | Resend | delivered, bounced, complained, deferred, failed |
| `POST /webhooks/mail/generic` | SendGrid, Mailgun, SES, Postmark, SMTP | mapped by event name |

## Security

- Resend HMAC signature verification when `RESEND_WEBHOOK_SECRET` set
- Updates `message_deliveries` by `provider_message_id`

## Status

✅ Receivers mounted and tested via unit/integration paths
