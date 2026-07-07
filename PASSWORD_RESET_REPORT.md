# Password Reset Report — v1.2.0

## Flow

1. User visits `/forgot-password` and submits email
2. Backend `POST /auth/forgot-password` creates hashed token (1-hour expiry)
3. Email sent via `notifyPasswordReset()` with link to `/reset-password?token=...`
4. User sets new password on `/reset-password`
5. Backend `POST /auth/reset-password` validates token, updates password, marks token used
6. User redirected to `/login`

## Security controls

| Control | Implementation |
|---------|----------------|
| One-time token | `used_at` set on completion |
| Expiration | 1 hour (`TOKEN_EXPIRY_MS`) |
| Replay protection | Token hash lookup + `used_at IS NULL` |
| Rate limiting | 5 requests/hour per user; express-rate-limit on endpoints |
| Audit logs | `user.password-reset-requested`, `user.password-reset-completed` |
| Enumeration safe | Forgot-password always returns success |

## Frontend

- `ForgotPasswordForm`, `ResetPasswordForm`
- Login page link: "Forgot password?"
- Public routes: `/forgot-password`, `/reset-password`

## Status

✅ End-to-end flow complete (backend + frontend).
