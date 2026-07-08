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
| Documentation | ✅ |
| Tests & reports | ✅ |

See [V1.3.0_FIELD_OPERATIONS_REPORT.md](./V1.3.0_FIELD_OPERATIONS_REPORT.md).

---

## v1.2.3 scope (shipped)

| Item | Status |
|------|--------|
| Invitation lifecycle timestamps & status labels | ✅ |
| SMS invitation delivery & logging | ✅ |
| Permanent deletion (message deliveries) | ✅ |
| Failed message human-readable reasons | ✅ |
| createObjectURL / upload preview fixes | ✅ |
| User profile crash fixes | ✅ |

See [V1.2.3_PLATFORM_STABILIZATION_REPORT.md](./V1.2.3_PLATFORM_STABILIZATION_REPORT.md).

---

## v1.2.2 scope (shipped)

| Item | Status |
|------|--------|
| Admin fee persistence (no login prompt) | ✅ |
| Permanent user deletion | ✅ |
| Session invalidation on suspend/delete/role change | ✅ |

See [V1.2.2_SECURITY_REPORT.md](./V1.2.2_SECURITY_REPORT.md).

---

## Verification status (v1.3.0 branch)

| Check | Result |
|-------|--------|
| `npm run type-check` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test -w @wilms/api` | **83/83** |
| `npm run test -w @wilms/frontend` | **230+** (run sharded with 12GB heap) |
| `npm run smoke:production` | Requires `WILMS_APP_URL` |
| `npm run smoke:rbac` | Requires live API |

---

## After v1.3.0 deploy

1. Run `npm run db:migrate -w @wilms/api` (migration `0020_v130_field_operations`)
2. Redeploy Railway API and Vercel frontend
3. Collector: verify Device health panel in Settings
4. Test offline payment queue → approver sync conflict review
5. Reinstall or refresh PWA for new service worker cache
