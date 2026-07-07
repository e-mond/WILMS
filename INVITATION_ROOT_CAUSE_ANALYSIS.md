# Invitation Root Cause Analysis — v1.2.1

**Date:** 2026-07-07  
**Issue:** Admin UI shows "Unable to invite user — A server error occurred."

## Symptom

`POST /settings/users` returned HTTP **500** with generic message. Frontend `apiClient` maps all 5xx responses to:

> A server error occurred. Please try again.

## Investigation trace

| Stage | Finding |
|-------|---------|
| Frontend | `SettingsUsersSection` → `settingsService.createUser()` → `POST /api/wilms/settings/users` |
| BFF | CSRF + session proxy to Railway API |
| Backend route | `settingsRouter.post('/settings/users')` with `MANAGE_USERS` RBAC |
| Service | `createUser()` inserts user, calls `notifyUserInvitation()` |
| Mail | `dispatchMail()` → Vercel relay or SMTP |
| Delivery log | `logMessageDelivery()` persists to `message_deliveries` |
| Error mapping | Unhandled Postgres errors bypassed `VALIDATION:` prefix → 500 |

## Root causes identified

### 1. Unhandled PostgreSQL unique violations (primary)

`users.email` has a **unique constraint**. `findUserByEmail()` only checks non-deleted users. Inviting an email that belongs to a **soft-deleted** user passed validation but failed on insert with error code `23505`. This was not mapped and surfaced as HTTP 500.

### 2. Generic 500 error masking

- Backend `errorHandler` returned fixed text: "An unexpected error occurred."
- Frontend `apiClient` discarded server message for all 5xx responses.

### 3. Delivery logging could fail the request after successful send (v1.2.0 regression)

`dispatchMail()` awaited `logMessageDelivery()` in the success path. If logging failed (schema mismatch, DB error), the thrown error could abort the invitation flow even when email was delivered.

### 4. Mail errors returned as raw exceptions

Relay/SMTP failures propagated as unmapped errors in some paths instead of actionable `VALIDATION:` messages.

## Fixes applied

1. `findAnyUserByEmail()` — detect active, invited, and soft-deleted email conflicts before insert
2. `mapDatabaseError()` — map `23505` unique violations to `VALIDATION` / `CONFLICT`
3. `mapServiceError()` — shared mapper for settings and global error handler
4. `dispatchMail()` — best-effort delivery logging; meaningful mail error messages
5. `notifyUserInvitation()` — `enableTracking: false` for transactional invites
6. Frontend `apiClient` — surface backend message on 5xx when available; handle 409 conflicts
7. Audit log entry on `user.invited`
8. Invitation email template — expiry date + support contact

## Verification

- New tests: `apps/backend/src/tests/settings/invitation.test.ts`
- All existing suites remain green
