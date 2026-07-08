# WILMS - Project Status

**Last updated:** 2026-07-08 (v1.2.3 ready)  
**Package version:** `1.2.3`  
**Branch:** `cursor/v123-platform-stabilization-8847`  
**Production:** v1.2.2 deployed — v1.2.3 pending

---

## Summary

v1.2.3 completes invitation lifecycle tracking, SMS invitation delivery hardening, failed-message UI readability, and production stability fixes (`createObjectURL`, user profile crashes). Builds on v1.2.2 security controls.

---

## v1.2.3 scope

| Item | Status |
|------|--------|
| Invitation lifecycle timestamps & status labels | ✅ |
| SMS invitation delivery & logging | ✅ |
| Permanent deletion (message deliveries) | ✅ |
| Failed message human-readable reasons | ✅ |
| createObjectURL / upload preview fixes | ✅ |
| User profile crash fixes | ✅ |
| Tests & reports | ✅ |

See [V1.2.3_PLATFORM_STABILIZATION_REPORT.md](./V1.2.3_PLATFORM_STABILIZATION_REPORT.md).

---

## v1.2.2 scope (shipped)

| Item | Status |
|------|--------|
| Admin fee persistence (no login prompt) | ✅ |
| Permanent user deletion | ✅ |
| Session invalidation on suspend/delete/role change | ✅ |
| Auth documentation | ✅ |
| Tests & reports | ✅ |

See [V1.2.2_SECURITY_REPORT.md](./V1.2.2_SECURITY_REPORT.md).

---

## Verification status

| Check | Result |
|-------|--------|
| `npm run type-check` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test -w @wilms/api` | **76/76** |
| `npm run test -w @wilms/frontend` | **225/225** |
| `npm run smoke:production` | **31/31** |
| `npm run smoke:rbac` | **11/11** |

---

## After v1.2.1 deploy

1. Invite a new user from Settings → Users
2. Confirm `201` response (not 500)
3. Verify invitation email in inbox
4. Check `message_deliveries` for `USER_INVITED` event
5. Retry duplicate email — expect clear conflict message
