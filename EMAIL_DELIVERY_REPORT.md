# WILMS v1.1.2 — Email Delivery Report

**Branch:** `hotfix/v1.1.2-user-management-notifications`  
**Version:** `1.1.2`  
**Date:** 2026-07-07

## Executive summary

Email delivery was unreliable for domain events (especially user invitations) because Railway blocks outbound SMTP. Test email worked via Vercel (v1.1.1 fix) but invitation and notification emails still attempted direct SMTP from Railway and failed silently.

v1.1.2 centralizes outbound mail through `dispatchMail()` with automatic Vercel relay for Gmail, persistent delivery logging, and explicit error propagation for invitations.

## Root cause

| Symptom | Root cause |
|---------|------------|
| Test email 502 (v1.1.1) | Railway SMTP timeout; fixed by routing UI test through Vercel `/api/mail/gmail` |
| Invitation emails not received | `createUser()` called `mail.send()` on Railway (blocked); errors swallowed with `void` + `console.error` |
| No delivery audit trail | No persistent log table; frontend mock-only delivery log |
| Inconsistent provider routing | Test email used Vercel; domain events used Railway SMTP |

## Architecture

```text
Railway API (dispatchMail)
  ├─ Resend configured → direct Resend API
  └─ Gmail/SMTP configured + WILMS_VERCEL_MAIL_URL set
       → POST /api/mail/send (Vercel relay)
            → Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD)
```

## Files modified

| File | Change |
|------|--------|
| `apps/backend/src/infrastructure/mail/dispatch.ts` | **New** — `dispatchMail()` with Vercel relay, retries, logging |
| `apps/frontend/src/app/api/mail/send/route.ts` | **New** — server-to-server Gmail relay endpoint |
| `apps/backend/src/infrastructure/notifications/event-dispatch.ts` | **New** — domain notification dispatch (email + SMS) |
| `apps/backend/src/infrastructure/notifications/delivery-log.ts` | **New** — `logMessageDelivery()`, `listMessageDeliveries()` |
| `apps/backend/src/infrastructure/notifications/templates.ts` | Added invitation, registration, loan email templates |
| `apps/backend/src/modules/settings/service.ts` | `createUser()` awaits `notifyUserInvitation()`; throws on failure |
| `apps/backend/src/modules/settings/routes.ts` | `GET /settings/delivery-logs` |
| `apps/backend/src/modules/borrowers/service.ts` | Registration approve/reject notifications |
| `apps/backend/src/modules/payments/service.ts` | Payment received / missed payment notifications |
| `apps/backend/src/modules/loans/service.ts` | Loan approved / disbursed notifications |
| `apps/backend/.env.production.example` | `WILMS_VERCEL_MAIL_URL`, `WILMS_INTERNAL_MAIL_SECRET` |
| `apps/frontend/.env.example` | `WILMS_INTERNAL_MAIL_SECRET` |

## Database changes

Migration `0014_v112_notifications.sql` creates `message_deliveries`:

- `id`, `event`, `channel`, `recipient`, `provider`, `provider_message_id`
- `subject`, `body_preview`, `success`, `failure_reason`, `retry_attempts`
- `borrower_id`, `loan_id`, `user_id`, `created_at`
- Indexes on `event`, `recipient`, `created_at`

## APIs affected

| Endpoint | Change |
|----------|--------|
| `POST /api/mail/send` (Vercel) | New server-to-server Gmail relay |
| `POST /api/mail/gmail` (Vercel) | Existing test email (v1.1.1) |
| `GET /settings/delivery-logs` | New searchable delivery history |
| `POST /settings/users` | Invitation email now required to succeed |

## Email events wired (v1.1.2)

| Event | Template | Status |
|-------|----------|--------|
| Test email | Settings UI | ✅ v1.1.1 + verified |
| User invitation | `buildUserInvitationEmail` | ✅ Wired |
| Registration approved | `buildRegistrationApprovedEmail` | ✅ Wired |
| Registration rejected | `buildRegistrationRejectedEmail` | ✅ Wired |
| Payment received | `buildPaymentConfirmationEmail` | ✅ Wired |
| Loan approved | `buildLoanApprovalEmail` | ✅ Wired |
| Password reset | — | ⏳ Not implemented |
| Welcome email | — | ⏳ Not implemented |
| Account activated/disabled | — | ⏳ Not implemented |
| Loan rejected/closed | — | ⏳ Not implemented |
| Payment reversal | — | ⏳ Not implemented |
| Overdue reminder | — | ⏳ Scheduler not implemented |

## Production configuration

**Railway (API):**
```env
WILMS_VERCEL_MAIL_URL=https://wilms.vercel.app
WILMS_INTERNAL_MAIL_SECRET=<shared-secret>
WILMS_APP_URL=https://wilms.vercel.app
MAIL_PROVIDER=gmail
```

**Vercel (frontend):**
```env
GMAIL_USER=<gmail-address>
GMAIL_APP_PASSWORD=<app-password>
MAIL_FROM=WILMS <noreply@domain>
WILMS_INTERNAL_MAIL_SECRET=<same-shared-secret>
```

## Verification evidence

| Check | Result |
|-------|--------|
| `npm run type-check` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run test -w @wilms/api` | 53/53 PASS |
| `npm run test -w @wilms/frontend` | 223/223 PASS |
| `send-test-email.test.ts` | 3/3 PASS |
| `smoke:production` | 31/31 PASS (current prod v1.1.1) |
| `smoke:rbac` | 11/11 PASS |

## Remaining issues

- No invite token flow; static temporary password `ChangeMe1!` (documented limitation)
- Password reset, welcome, account status, loan rejected/closed, payment reversal emails not yet wired
- Payment reminder scheduler (`paymentReminderDaysBefore`) stored but not scheduled
- Production v1.1.2 deploy required to apply migration `0014` and relay configuration on Railway
