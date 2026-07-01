# RC1 Email Audit

**Date:** 2026-07-01

## Provider configuration

| Env var | Purpose |
|---------|---------|
| `MAIL_PROVIDER=gmail` | Select Gmail SMTP adapter |
| `GMAIL_USER` | Sender account |
| `GMAIL_APP_PASSWORD` | App password (not account password) |

Backend: [`apps/backend/src/infrastructure/mail/config.ts`](../../apps/backend/src/infrastructure/mail/config.ts)

## Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/settings/email/test` | POST | Send test email from Settings |

## Test flow

1. Super Admin → Settings → Email section
2. Enter recipient → Test send
3. Backend uses `getMailProvider()` → Gmail SMTP

## Production requirements

- Set `MAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` in **Railway** (backend)
- Frontend BFF does not send mail directly in production admin flows (backend only)

## Verdict

Email infrastructure implemented. Production send requires Railway env vars configured. Test endpoint is POST-only (GET returns 404 — expected).
