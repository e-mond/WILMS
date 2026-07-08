# Authentication

**Version:** 1.2.2

## Session model

- HMAC-signed cookie (`wilms_session`) issued by the Next.js BFF after `POST /api/auth/login`.
- Payload includes `userId`, `role`, `displayName`, `expiresAt`, `status`, and `sessionVersion`.
- API `requireAuth` validates signature, expiry, account status, role match, and session version.

## Flows

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/login` | Email/password; optional 2FA OTP challenge |
| `POST /auth/verify-otp` | Complete 2FA when enabled |
| `POST /auth/complete-onboarding` | Invited users set password and profile |
| `POST /auth/logout` | Client cookie clear |
| `POST /auth/forgot-password` | Email + SMS reset notice |
| `POST /auth/reset-password` | Token-based password reset |

## Session invalidation

When an administrator suspends, deletes, or changes a user's role, `users.session_version` increments. Existing tokens fail on the next API call with `401 Session has been revoked`.

## Timeouts

- Session duration: configured via `sessionDurationMs` / system settings.
- App lock idle timeout: separate PIN overlay for collectors (not an administration fee).

## Related

- [security-guide.md](./security-guide.md)
- [USER_LIFECYCLE_REPORT.md](../USER_LIFECYCLE_REPORT.md)
