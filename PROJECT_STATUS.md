# WILMS - Project Status

**Last updated:** 2026-07-07 (v1.2.1 ready)  
**Package version:** `1.2.1`  
**Branch:** `feature/v1.2.1-communication-stabilization`  
**Production:** v1.2.0 deployed — v1.2.1 pending

---

## Summary

v1.2.1 stabilizes the communication platform for production. The primary fix resolves user invitation failures that returned generic HTTP 500 errors. All v1.2.0 features remain operational.

---

## v1.2.1 scope

| Item | Status |
|------|--------|
| Invitation 500 fix | ✅ |
| Meaningful API errors | ✅ |
| Delivery log hardening | ✅ |
| Invitation email template | ✅ |
| Communication verification | ✅ |
| Tests & smoke | ✅ |

See [V1.2.1_INVITATION_FIX_REPORT.md](./V1.2.1_INVITATION_FIX_REPORT.md) and [INVITATION_ROOT_CAUSE_ANALYSIS.md](./INVITATION_ROOT_CAUSE_ANALYSIS.md).

---

## Verification status

| Check | Result |
|-------|--------|
| `npm run type-check` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test -w @wilms/api` | **65/65** |
| `npm run test -w @wilms/frontend` | **223/223** |
| `npm run smoke:production` | **31/31** |
| `npm run smoke:rbac` | **11/11** |

---

## After v1.2.1 deploy

1. Invite a new user from Settings → Users
2. Confirm `201` response (not 500)
3. Verify invitation email in inbox
4. Check `message_deliveries` for `USER_INVITED` event
5. Retry duplicate email — expect clear conflict message
