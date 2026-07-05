# RC1 SMS Audit

**Date:** 2026-07-01

## Provider: SMSNotifyGH

| Env var | Purpose |
|---------|---------|
| `SMS_PROVIDER=smsnotifygh` | Select adapter |
| `SMSNOTIFYGH_API_KEY` | API key |
| `SMSNOTIFYGH_SENDER_ID` | Sender ID |

Adapter: [`apps/backend/src/infrastructure/sms/smsnotifygh-adapter.ts`](../../apps/backend/src/infrastructure/sms/smsnotifygh-adapter.ts)

Uses GET query-string API:
- Send: `{baseUrl}?key=...&to=...&msg=...&sender_id=...`
- Balance: separate balance endpoint

## Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/settings/sms/test` | POST | Send test SMS |
| `/settings/sms/balance` | GET | Check provider balance |

## Payment confirmation trigger

- SMS on payment confirmation wired in `payments/service.ts` when notifications enabled

## Production requirements

- Set SMS env vars in **Railway**
- Test/balance routes require auth + `MANAGE_SYSTEM_SETTINGS`

## Verdict

SMS infrastructure implemented. Production send requires Railway credentials. Test endpoint is POST-only (GET returns 404 ÔÇö expected).
