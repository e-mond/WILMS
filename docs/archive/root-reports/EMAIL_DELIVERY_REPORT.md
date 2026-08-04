# Email Delivery Report — v1.2.1

## Invitation email pipeline

```
createUser() → notifyUserInvitation() → dispatchMail() → Vercel relay → Gmail SMTP
                                      ↘ logMessageDelivery() → message_deliveries
```

## Template content (invitation)

- WILMS branded layout via `buildEmailTemplate()`
- Logo, header, footer, primary CTA button
- Temporary password + expiry date
- Support contact (support@wilms.org)
- Responsive HTML (email-layout engine)
- Plain-text fallback

## Delivery logging

Every attempt records `event=USER_INVITED`, recipient, provider, success/failure, retry count.

## v1.2.1 improvements

- Logging failures no longer abort successful sends
- Mail errors return actionable 422 messages
- Invitation emails skip marketing tracking pixel

## Configuration

```env
WILMS_VERCEL_MAIL_URL=https://wilms.vercel.app
WILMS_INTERNAL_MAIL_SECRET=<secret>
WILMS_APP_URL=https://wilms.vercel.app
GMAIL_USER=<address>
GMAIL_APP_PASSWORD=<app-password>
```
