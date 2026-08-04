# User Management Report — v1.2.3

## Invitation Lifecycle

### States

1. **Invited** — account created, no acceptance or login yet (`invited_at` set)
2. **Accepted** — user opened the accept-invitation link (`accepted_at` set)
3. **Pending setup** — user signed in but has not finished `/complete-profile` (`first_login_at` set, status still `INVITED`)
4. **Active** — onboarding completed with new password (`status = ACTIVE`)

### API

| Endpoint | Purpose |
|----------|---------|
| `POST /settings/users` | Create invited user, send email + optional SMS |
| `POST /auth/accept-invitation` | Record acceptance from email link |
| `POST /auth/login` | Record first login for invited users |
| `POST /auth/complete-onboarding` | Password change → `ACTIVE` |

### Audit Events

- `user.invited`
- `user.invitation_resent`
- `user.invitation_accepted`
- `user.activated`
- `user.deleted`

All map to dedicated `audit_action` enum values in Postgres.

## Permanent Deletion

- **INVITED** users: hard-deleted with auth artifacts purged
- **Active** users: anonymized, sessions invalidated, related notifications/OTP/reset tokens/push subscriptions/message deliveries removed

## Settings UI

- Status column uses `statusLabel` from API
- Invitation email and SMS delivery status returned on create/resend
- User profile modal includes error handling and safe defaults
