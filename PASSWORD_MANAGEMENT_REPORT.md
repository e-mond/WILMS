# Password Management Report — v1.2.3

## Verified Workflows

| Workflow | Implementation |
|----------|----------------|
| Forgot password | `POST /auth/forgot-password` with rate limiting |
| Reset password | `POST /auth/reset-password` with token validation |
| Invitation onboarding | `POST /auth/complete-onboarding` enforces 8+ char password |
| 2FA OTP | Email + SMS via `otp.service.ts` when enabled |
| Session invalidation | `session_version` bump on suspend/delete/role change |
| Password reset token purge | Removed on permanent user deletion |

## Invitation Password Flow

Invited users must change the temporary password during `/complete-profile` before receiving `ACTIVE` status. Session cookie is refreshed with updated status after onboarding.

## Trusted Devices & Login History

Device and login history are presented in Settings user profile from service-layer aggregates. Session cookies remain stateless HMAC tokens with `sessionVersion` validation.

## Recommendations

- Enforce password expiry policy via scheduled job when `passwordPolicy` settings expand
- Persist trusted-device registry when dedicated table is introduced
