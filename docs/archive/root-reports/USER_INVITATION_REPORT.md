# WILMS v1.1.2 — User Invitation Report

**Branch:** `hotfix/v1.1.2-user-management-notifications`  
**Version:** `1.1.2`  
**Date:** 2026-07-07

## Executive summary

User invitation emails were generated in code but never reached recipients. v1.1.2 fixes end-to-end delivery by routing through Vercel Gmail relay, awaiting delivery (no silent swallow), and logging every attempt.

## Investigation — end-to-end flow

| Stage | Before v1.1.2 | After v1.1.2 |
|-------|---------------|--------------|
| Invitation creation | `POST /settings/users` → `createUser()` | Same |
| Token generation | Static password `ChangeMe1!` (no token) | Unchanged (documented limitation) |
| Queue | None (synchronous) | None (synchronous, awaited) |
| Mail service | `getMailProvider().send()` on Railway | `dispatchMail()` → Vercel relay |
| SMTP/API provider | Gmail SMTP from Railway (blocked) | Gmail SMTP from Vercel |
| Delivery status | Swallowed with `void` + `console.error` | Throws `VALIDATION` on failure; logged |
| Logs | Console only | `message_deliveries` table |
| Retry | None | Up to 2 retries with backoff |
| Expiration | N/A (no token) | N/A |

## Root cause

```typescript
// Before (settings/service.ts)
void mail.send({ ... }).catch(console.error);
```

1. Railway blocks outbound SMTP connections
2. Email send failed silently — user created but no email delivered
3. Admin had no visibility into delivery failure

## Fix

```typescript
// After (settings/service.ts)
await notifyUserInvitation({
  email,
  displayName,
  temporaryPassword: DEFAULT_INVITE_PASSWORD,
  userId,
});
```

`notifyUserInvitation()` → `dispatchMail()` → Vercel `/api/mail/send` → Gmail SMTP

On failure, `createUser()` throws validation error so admin knows invitation was not delivered.

## Files modified

| File | Change |
|------|--------|
| `apps/backend/src/modules/settings/service.ts` | Await invitation; throw on failure |
| `apps/backend/src/infrastructure/notifications/event-dispatch.ts` | `notifyUserInvitation()` |
| `apps/backend/src/infrastructure/notifications/templates.ts` | `buildUserInvitationEmail()` |
| `apps/backend/src/infrastructure/mail/dispatch.ts` | Vercel relay + logging |
| `apps/frontend/src/app/api/mail/send/route.ts` | Server-to-server relay endpoint |

## Invitation email content

- Subject: WILMS account invitation
- Body: display name, email, temporary password, login URL (`WILMS_APP_URL`)
- HTML rendering via Gmail SMTP multipart

## Production configuration required

```env
# Railway
WILMS_VERCEL_MAIL_URL=https://wilms.vercel.app
WILMS_INTERNAL_MAIL_SECRET=<shared-secret>
WILMS_APP_URL=https://wilms.vercel.app

# Vercel
GMAIL_USER=<address>
GMAIL_APP_PASSWORD=<app-password>
MAIL_FROM=WILMS <noreply@domain>
WILMS_INTERNAL_MAIL_SECRET=<same-secret>
```

## Delivery logging

Every invitation attempt records:

| Field | Example |
|-------|---------|
| `event` | `USER_INVITATION` |
| `channel` | `EMAIL` |
| `recipient` | `officer@example.com` |
| `provider` | `gmail-smtp-vercel` |
| `provider_message_id` | Gmail message ID |
| `success` | `true` / `false` |
| `failure_reason` | Error message if failed |
| `retry_attempts` | 0–2 |
| `user_id` | Created user UUID |

Queryable via `GET /settings/delivery-logs?event=USER_INVITATION`.

## Verification

| Check | Result |
|-------|--------|
| Unit tests | 53/53 backend, 223/223 frontend |
| Relay endpoint auth | `X-Wilms-Mail-Secret` required (401 without) |
| Missing Gmail creds | 422 with clear error |
| `smoke:rbac` admin settings/users | 200 |

## Remaining limitations

- **No invite token / magic link** — users receive static password `ChangeMe1!` and must change on first login (future enhancement)
- **No expiration** — no time-limited invite links
- **No invitation SMS** — email only
- **Production deploy required** — Railway must have `WILMS_VERCEL_MAIL_URL` + `WILMS_INTERNAL_MAIL_SECRET` before invitations work in production
