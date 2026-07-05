# RC1 Notification Audit ÔÇö Phase 2

**Date:** 2026-07-01

## Channels

| Channel | Phase 2 status |
|---------|----------------|
| Toast | All new mutations show success/error via `useToast` |
| Inbox | `GET/PATCH /notifications/inbox*` unchanged |
| SMS | `sendNotification` dispatches when `SMS` channel + provider configured |
| Email | `sendNotification` dispatches when `EMAIL` channel + mail configured |
| Invite welcome email | Sent from `createUser` when Gmail/SMTP configured |

## Payment SMS

`maybeSendPaymentConfirmationSms` unchanged ÔÇö gated by `smsNotificationsEnabled`.

## Graceful fallback

When `MAIL_PROVIDER=none` or `SMS_PROVIDER=none`, dispatch skips with logged warning; inbox row still created.

## Verdict

**PASS** ÔÇö Notification dispatch wired; provider keys required for live delivery.
