# WILMS Offline Authentication Report (Phase 9F)

**Product version:** 1.8.0  
**Language:** British English  

## Architecture notes (code)

- Sessions are custom HMAC cookies (not JWT SPA storage as primary).
- API calls to `/api/wilms/*` require a live session when online.
- Offline shell may show cached HTML; **privilege must not expand** merely because a shell route is cached.
- RoleGuard / PermissionGate still evaluate client session state; server remains authoritative on reconnect.

## Checks

| Check | Result |
|-------|--------|
| Existing session offline | **BLOCKED** — device |
| Expired session offline | **BLOCKED** |
| Revoked session after reconnect | **BLOCKED** |
| Logout while offline | **BLOCKED** |
| Login while offline | **BLOCKED** (expected fail — no network) |
| Reconnect after expiry | **BLOCKED** |
| Multiple tabs | **BLOCKED** |
| Role changes after reconnect | **BLOCKED** |
| Privilege escalation via cached shell | **Not observed** — no device run; **static risk:** cached HTML must not be treated as authorisation |

## Required to unblock

Staging credentials for Super Admin + Collector, real browser, ability to revoke/expire session server-side.
