# Final RBAC Matrix — Product Acceptance (v1.3.8)

**Phase:** 21  
**Date:** 17 July 2026  
**SSoT:** `packages/shared-rbac`  
**Human-readable mirror:** `docs/permission-matrix.md` (dated 17 July 2026)

---

## 1. Roles (product boundary)

| # | Role | Enum | Portal access permission |
|---|------|------|------------------------|
| 1 | Super Admin | `SUPER_ADMIN` | All permissions (`Object.values(PERMISSION)`) |
| 2 | Registration Officer | `REGISTRATION_OFFICER` | `ACCESS_REGISTRATION_PORTAL` |
| 3 | Approver | `APPROVER` | `ACCESS_APPROVER_PORTAL` |
| 4 | Collector | `COLLECTOR` | `ACCESS_COLLECTOR_PORTAL` |
| 5 | Auditor | `AUDITOR` | `ACCESS_AUDITOR_PORTAL` |

**Not a role:** Borrower. Borrowers are data records in `modules/borrowers/`; there is no `ACCESS_BORROWER_PORTAL` permission.

Source: `packages/shared-rbac/src/roles.ts`, `role-permissions.ts`

---

## 2. Enforcement layers

| Layer | Location | Authority |
|-------|----------|-----------|
| Permission definitions | `packages/shared-rbac/src/permissions.ts` | SSoT |
| Role → permission map | `packages/shared-rbac/src/role-permissions.ts` | SSoT |
| API middleware | `apps/backend/src/middleware/require-permission.ts` | **Enforcement** |
| Effective permissions (overrides) | `apps/backend/src/infrastructure/permissions/resolve-user-permissions.ts` | Merged at request time |
| Frontend constants | `apps/frontend/src/constants/permissions.ts` | Re-export from shared |
| UI gate | `apps/frontend/src/components/auth/PermissionGate.tsx` | Cosmetic |

---

## 3. SoD highlights (v1.3.8 accepted)

| Rule | Evidence |
|------|----------|
| Collector **no** `MANAGE_GROUPS` | `role-permissions.ts` lines 11–14; `docs/permission-matrix.md` line 57 |
| Auditor **no** `ACCESS_ADMIN_PORTAL` | Not in auditor permission list; blocks recon review mutation |
| Reconciliation review → Super Admin | `reconciliation/routes.ts` `ACCESS_ADMIN_PORTAL` |
| Approver cannot manage users | No `MANAGE_USERS` on approver role |
| Collector cannot approve loans | No `APPROVE_LOANS` on collector role |

---

## 4. Permission overrides

| Capability | Who can grant | Permission required |
|------------|---------------|---------------------|
| Per-user permission grants/revokes | Super Admin only | `ASSIGN_PERMISSIONS` |

UI: `apps/frontend/src/features/settings/components/SettingsUserPermissionOverrides.tsx` wrapped in `PermissionGate` for `ASSIGN_PERMISSIONS`.

API: User permission override endpoints gated server-side (v1.3.8 Added per `CHANGELOG.md`).

**Acceptance:** Overrides are auditable extensions; base role matrix remains SSoT for default behaviour.

---

## 5. Full matrix (default role grants)

Aligned with `docs/permission-matrix.md`. When drift occurs, **trust `packages/shared-rbac`**.

### Portal access

| Permission | Collector | Reg. Officer | Approver | Auditor | Super Admin |
|------------|:---------:|:------------:|:--------:|:-------:|:-----------:|
| access-collector-portal | ✓ | | | | ✓ |
| access-registration-portal | | ✓ | | | ✓ |
| access-approver-portal | | | ✓ | | ✓ |
| access-auditor-portal | | | | ✓ | ✓ |
| access-admin-portal | | | | | ✓ |

### Registration & borrowers

| Permission | Collector | Reg. Officer | Approver | Auditor | Super Admin |
|------------|:---------:|:------------:|:--------:|:-------:|:-----------:|
| register-borrowers | ✓ | ✓ | | | ✓ |
| edit-borrowers | | ✓ | | | ✓ |
| edit-pending-registrations | | ✓ | | | ✓ |
| capture-documents | ✓ | ✓ | | | ✓ |
| upload-signatures | ✓ | ✓ | | | ✓ |
| gps-verification | | ✓ | | | ✓ |
| manage-groups | | | | | ✓ |
| view-assigned-borrowers | ✓ | | | | ✓ |

### Lending & collections

| Permission | Collector | Reg. Officer | Approver | Auditor | Super Admin |
|------------|:---------:|:------------:|:--------:|:-------:|:-----------:|
| review-applications | | | ✓ | | ✓ |
| approve-borrowers | | | ✓ | | ✓ |
| approve-loans | | | ✓ | | ✓ |
| reject-loans | | | ✓ | | ✓ |
| record-collections | ✓ | | | | ✓ |
| record-expenses | ✓ | | | | ✓ |
| manage-expenses | | | | | ✓ |

### Reports & audit

| Permission | Collector | Reg. Officer | Approver | Auditor | Super Admin |
|------------|:---------:|:------------:|:--------:|:-------:|:-----------:|
| view-reports | | | | ✓ | ✓ |
| view-financial-reports | | | | | ✓ |
| export-reports | | | | ✓ | ✓ |
| view-audit-log | | | | ✓ | ✓ |
| view-audit-history | | | | | ✓ |
| review-risk-flags | | | ✓ | ✓ | ✓ |

### Administration

| Permission | Collector | Reg. Officer | Approver | Auditor | Super Admin |
|------------|:---------:|:------------:|:--------:|:-------:|:-----------:|
| view-all-users | | | | | ✓ |
| edit-users | | | | | ✓ |
| manage-users | | | | | ✓ |
| assign-permissions | | | | | ✓ |
| assign-roles | | | | | ✓ |
| manage-system-settings | | | | | ✓ |
| manage-communications | | | | | ✓ |

*(Super Admin receives all permissions including those not listed in sub-tables.)*

---

## 6. Route-level RBAC samples

| Route prefix | Middleware pattern | File |
|--------------|-------------------|------|
| `/ops/*` | `ACCESS_ADMIN_PORTAL` | `ops/routes.ts` |
| `/payments/*` (mutations) | `RECORD_COLLECTIONS` | `payments/routes.ts` |
| `/reconciliations/*/review` | `ACCESS_ADMIN_PORTAL` | `reconciliation/routes.ts` |
| Collector portal | `collector-portal/access.ts` | Assigned borrower scope |

Frontend auth middleware: `apps/frontend/src/tests/auth/middleware.test.ts`

---

## 7. Verification commands

```bash
npm run smoke:rbac -w @wilms/api
```

Demo users per role: `apps/backend/src/seed/demo-users.ts`

---

## 8. RBAC sign-off

| Criterion | Status |
|-----------|--------|
| Five roles only | ✅ |
| Matrix matches code | ✅ |
| Collector SoD fix | ✅ |
| Override scope limited | ✅ |
| API enforcement primary | ✅ |

**RBAC acceptance:** ✅ **Approved** for v1.3.8.
