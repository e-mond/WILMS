# User Management Report (v1.6.2)

## Existing (confirmed)

Create/invite, resend invite, edit, suspend, activate, delete/purge, roles CRUD, permission overrides, settings activity.

## Added in v1.6.2

| Capability | API / UI |
|------------|----------|
| Force logout / terminate sessions | `POST /settings/users/:id/force-logout` + profile modal |
| Login / failed-login history | `auth_login_events` + `GET /settings/users/:id/login-history` |

## MFA readiness

OTP login challenge path remains when `twoFactorRequired` is enabled in settings (pre-existing).
