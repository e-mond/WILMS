# Password Reset Verification — v1.2.1

| Step | Endpoint / Page | Status |
|------|-----------------|--------|
| Forgot password form | `/forgot-password` | ✅ |
| Request reset | `POST /auth/forgot-password` | ✅ |
| Email with token | `notifyPasswordReset()` | ✅ |
| Reset form | `/reset-password?token=` | ✅ |
| Set new password | `POST /auth/reset-password` | ✅ |
| Login redirect | `/login` | ✅ |

## Security controls verified

- SHA-256 hashed tokens, 1-hour expiry
- One-time use (`used_at`)
- Rate limiting (5 requests/hour)
- Audit logs on request + completion
- Enumeration-safe forgot-password response

## Status

✅ End-to-end flow operational
