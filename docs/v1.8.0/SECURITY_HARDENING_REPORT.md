# WILMS v1.8.0 — Security Hardening Report

## Completed in this release

- Eliminated runtime Google Fonts stylesheet requests (CSP `font-src 'self'` compatible via `next/font` self-hosting)
- Holiday request API maps missing schema / DB errors to controlled 503 responses (`SCHEMA_MISSING`) instead of raw 500s
- Maker-checker preserved on holiday approval (no self-approval)
- Automation endpoints require authentication + `MANAGE_SYSTEM_SETTINGS` (or portal permissions for task listing)
- Offline sync continues to use authenticated session + conflict review for financial ops
- App Lock retains PIN + optional device-local WebAuthn unlock with idle timeout

## App Lock residual

WebAuthn credentials are device-local (credential id in browser storage). Server attestation / cross-device recovery is not part of v1.8.0. Operators should treat App Lock as device protection, not a replacement for session authentication.

## Dependency posture

Run before production cutover:

```bash
npm audit --omit=dev
```

Document any remaining CVEs with justification; do not blind force-upgrade packages that touch financial/auth paths.

## Automation / push / holiday surfaces

- Push subscriptions remain VAPID-optional with graceful disable
- Quiet hours preferences are user-controlled
- Holiday evidence accepts URL/reference strings (operators should only store approved document URLs)
