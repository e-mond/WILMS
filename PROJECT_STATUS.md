# WILMS - Project Status

**Last updated:** 2026-07-08 (v1.3.0 ready)  
**Package version:** `1.3.0`  
**Branch:** `cursor/v1.3.0-field-operations-8847`  
**Production:** v1.2.3 deployed — v1.3.0 pending

---

## Summary

v1.3.0 establishes field-operations foundations: offline PWA shell, device health monitoring, background uploads, sync conflict resolution, and advanced lending domain modules.

---

## v1.3.0 scope

| Item | Status |
|------|--------|
| PWA offline shell + background sync | ✅ |
| Device health (battery, storage, uploads) | ✅ |
| Sync conflict approver UI | ✅ |
| QR/barcode scanner + receipt printing | ✅ |
| Grace periods in repayment engine | ✅ |
| Fees, penalties, guarantor scoring (domain) | ✅ |
| Tests & reports | ✅ |

See [V1.3.0_FIELD_OPERATIONS_REPORT.md](./V1.3.0_FIELD_OPERATIONS_REPORT.md).

---

## v1.2.3 scope (shipped)

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
