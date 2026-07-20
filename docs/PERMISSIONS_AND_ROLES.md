# WILMS Permissions and Roles — v1.4.1

**Date:** 2026-07-20  
**Source of truth:** `packages/shared-rbac` (`role-permissions.ts`, `permissions.ts`)  
**Matrix table:** [`permission-matrix.md`](./permission-matrix.md)  
**Security audit:** [`certification/v1.4/final-system-audit/FINAL_SECURITY_AUDIT.md`](./certification/v1.4/final-system-audit/FINAL_SECURITY_AUDIT.md)

---

## Roles

| Role | Portal intent |
|------|----------------|
| Collector | Field collections, assigned borrowers |
| Registration Officer | Registration / documents / GPS verification |
| Approver | Application and loan approval |
| Auditor | Reports and audit visibility (limited mutation) |
| Super Admin | Full permission set + admin portal |

Effective permissions = role defaults ± per-user overrides (`user_permission_overrides`).

---

## Enforcement rules

1. **API is authoritative** — never rely on hidden nav items alone.  
2. Collectors are scoped to **assigned borrowers** for payment GET surfaces (payment-entry, same-day, payment-by-id) and admin-fee-status — **Verified** hardening in v1.4.1.  
3. UI must **remove** (not CSS-hide) unauthorized controls where role-restricted.  
4. Session revoke / suspend must yield unauthenticated session reads (`assertSessionActive`).

---

## SoD highlights (including residuals)

| Control | Status |
|---------|--------|
| Collectors lack `manage-groups` | Enforced (v1.3.8+) |
| Auditor without `access-admin-portal` | Enforced |
| Adjustment self-approve | **Residual Medium** — risk accept or fix |
| Expenses self-post APPROVED | **Residual Medium** |

---

## Demo accounts

Demo identities (`*@wilms.demo`) are for local/non-production only. Production login is rejected; production seed is gated off — **Verified** in `apps/backend/src/lib/demo-accounts.ts`.

---

## Related UX

Permission catalog review (UX pack): [`certification/v1.4/ux-modernisation/PERMISSION_CATALOG_REVIEW.md`](./certification/v1.4/ux-modernisation/PERMISSION_CATALOG_REVIEW.md)  
Roles guide: [`certification/v1.4/ux-modernisation/ROLES_AND_PERMISSIONS_GUIDE.md`](./certification/v1.4/ux-modernisation/ROLES_AND_PERMISSIONS_GUIDE.md)
