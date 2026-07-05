# RC1 Auth Audit ÔÇö Phase 2

**Date:** 2026-07-01

## Session model

- **Not JWT** ÔÇö HMAC-signed token (`wilms_session` HttpOnly cookie)
- BFF attaches `Authorization: Bearer` to upstream Railway API
- 24h session TTL; `SessionExpiryHandler` on 401

## Phase 2 changes

| Item | Status |
|------|--------|
| `supervisor-alert` RBAC | `RECORD_COLLECTIONS` or `MANAGE_USERS` required |
| Force logout UI | Removed ÔÇö no server revocation API |
| MFA enrollment UI | Removed ÔÇö deferred to roadmap |
| Welcome email on invite | Implemented when mail provider configured |

## Role verification

Production smoke extended with BFF probes for settings, dashboard, groups, pools, risk flags, messages, collectors (authenticated Super Admin).

## Cookie flags

HttpOnly, Secure (prod), SameSite=Lax ÔÇö verified in `production-smoke.ts`.

## Verdict

**PASS** ÔÇö Auth flows unchanged; security gaps closed or hidden per golden rules.
