# PG-07 — Settings Functional Audit

**Date:** 2026-06-20  
**Scope:** All 11 settings sections — button/action matrix

---

## Summary

| Section | Status |
|---------|--------|
| Organisation | Functional — PATCH `/settings` |
| My Account | Functional — GET/PATCH `/settings/me` |
| User Management | Functional — existing user CRUD + suspend in profile modal |
| Roles & Permissions | Functional — existing role CRUD |
| Expense Management | Functional — expense review section |
| Security & Access | Functional — PATCH `/settings` security fields |
| Notifications | Functional — PATCH `/settings` notification fields |
| Loan Rules | Functional — PATCH `/settings` loan rule fields |
| SMS & Comms | Functional — PATCH `/settings` + POST `/settings/sms/test` |
| Integrations | Functional — PATCH `/settings` integration fields |
| Audit & Logs | Functional — PATCH `/settings` + link to `/reports/audit-log` |

---

## Section matrix

### Organisation

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| Organisation name | Editable + Save | `PATCH /settings` `organisationName` |
| System name | Editable + Save | `PATCH /settings` `systemName` |
| Primary colour | Editable + Save | `PATCH /settings` `primaryColour` |
| Accent colour | Editable + Save | `PATCH /settings` `accentColour` |
| Logo asset | Editable + Save | `PATCH /settings` `logoAsset` |
| Save organisation | Button | `PATCH /settings` |

### My Account

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| Display name | Editable + Save profile | `PATCH /settings/me` |
| Email | Editable + Save profile | `PATCH /settings/me` |
| Role | Read-only | `GET /settings/me` |
| Phone | Read-only | `GET /settings/me` |

### User Management

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| User list | Load | `GET /settings/users` |
| Create user | Modal | `POST /settings/users` |
| Edit user | Modal | `PATCH /settings/users/:id` |
| Disable / activate | Actions | `POST .../disable`, `.../activate` |
| Profile modal — Suspend | Button | `POST /settings/users/:id/disable` |
| Profile modal — Reset password | Disabled | Documented placeholder (IdP) |
| Profile modal — Reset PIN | Disabled | Collector device flow |
| Profile modal — Force logout | Disabled | Documented placeholder |
| Profile modal — Enable MFA | Disabled | Documented placeholder |

### Roles & Permissions

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| Role list | Load | `GET /settings/roles` |
| Create role | Modal | `POST /settings/roles` |
| Edit permissions | Modal | `PATCH /settings/roles/:id` |
| Clone / delete | Actions | `POST .../clone`, `.../delete` |

### Expense Management

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| Expense queue | Load + review | `GET /expenses`, review mutations |

### Security & Access

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| 2FA toggle | Switch + Save | `PATCH /settings` `twoFactorRequired` |
| Session timeout | Select + Save | `PATCH /settings` `sessionTimeoutMinutes` |
| Password policy | Select + Save | `PATCH /settings` `passwordPolicy` |
| IP allowlist | Switch + Save | `PATCH /settings` `ipAllowlistEnabled` |
| Failed login lockout | Select + Save | `PATCH /settings` `failedLoginLockoutAttempts` |
| App lock note | Info text | Client-side PIN hash documented |

### Notifications

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| Email notifications | Switch + Save | `PATCH /settings` |
| Payment reminder lead time | Select + Save | `PATCH /settings` `paymentReminderDaysBefore` |
| Supervisor escalations | Switch + Save | `PATCH /settings` `supervisorEscalationsEnabled` |

### Loan Rules

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| Max loan amount | Input + Save (super admin) | `PATCH /settings` `maxLoanAmountPesewas` |
| Min / max group size | Input + Save | `PATCH /settings` |
| Default duration | Select + Save | `PATCH /settings` `defaultLoanDurationWeeks` |
| Loan rollovers | Switch + Save | `PATCH /settings` `allowLoanRollovers` |
| Grace period | Select + Save | `PATCH /settings` `latePaymentGraceDays` |

### SMS & Comms

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| SMS provider | Select (SMSNotifyGH) + Save | `PATCH /settings` `smsProvider` |
| Payment confirmation SMS | Switch + Save | `PATCH /settings` `smsNotificationsEnabled` |
| Missed payment alert | Switch + Save | `PATCH /settings` `missedPaymentSmsEnabled` |
| Approval notification | Switch + Save | `PATCH /settings` `approvalSmsEnabled` |
| Sender ID | Input + Save | `PATCH /settings` `smsSenderId` |
| Send test | Button | `POST /settings/sms/test` |
| Payment trigger | Backend | `maybeSendPaymentConfirmationSms` on `POST /payments` |

### Integrations

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| SMS gateway status | Read-only from settings | `GET /settings` |
| Email provider label | Input + Save | `PATCH /settings` `emailProviderLabel` |
| GPS verification | Switch + Save | `PATCH /settings` `gpsVerificationEnabled` |

### Audit & Logs

| Control | Action | API / behaviour |
|---------|--------|-----------------|
| Immutable audit trail | Switch + Save | `PATCH /settings` |
| Audit export | Switch + Save | `PATCH /settings` |
| Monitoring alerts | Switch + Save | `PATCH /settings` |
| View audit log | Link | `/reports/audit-log` |

---

## Nav fix

Security nav item now renders **only** the Security & Access section (no longer bundles Users, Loan Rules, or SMS).

---

## Backend persistence

Settings persist in `system_settings` (migration `0009_settings_extensions`) via `system-settings.repository.ts`. Survives Railway restart when `DATABASE_URL` is set.

---

## SMSNotifyGH env vars (backend)

| Variable | Purpose |
|----------|---------|
| `SMS_PROVIDER=smsnotifygh` | Select provider |
| `SMSNOTIFYGH_API_KEY` | API key (`x-api-key` header) |
| `SMSNOTIFYGH_SENDER_ID` | Approved sender ID |
| `SMSNOTIFYGH_API_URL` | Optional override (default `https://api.smsnotifygh.com/v1/sms/send`) |
