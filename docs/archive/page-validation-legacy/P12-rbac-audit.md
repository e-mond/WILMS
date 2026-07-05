# P12 RBAC Audit

Audit date: 2026-06-09. No new permissions were added in P12. Existing permission IDs from `src/constants/permissions.ts` only.

---

## Route-level protection (pages)

| Portal | Guard | Required permission(s) | Evidence |
|--------|-------|------------------------|----------|
| Super Admin | `RoleGuard` ÔåÆ `PermissionRouteGuard` | `ACCESS_ADMIN_PORTAL` | `src/app/(super-admin)/layout.tsx` |
| Collector | same | `ACCESS_COLLECTOR_PORTAL` | `src/app/(collector)/layout.tsx` |
| Registration Officer | same | `ACCESS_REGISTRATION_PORTAL` | `RegistrationOfficerLayoutClient.tsx` |
| Approver | same | `ACCESS_APPROVER_PORTAL` | `src/app/(approver)/layout.tsx` |
| Auditor | same | `ACCESS_AUDITOR_PORTAL` | `src/app/(auditor)/layout.tsx` |

Additional path rules: `ROUTE_PERMISSION_REQUIREMENTS` in `src/lib/rbac/permission-matrix.ts` (used by `canAccessPathWithPermissions`).

Navigation items filtered by `useFilteredNavItems` + `NAV_ITEM_PERMISSIONS` (`src/hooks/useFilteredNavItems.ts`).

---

## `PermissionGate` rollout (component-level)

**Files using `PermissionGate`:**

| File | Permission(s) gated |
|------|---------------------|
| `SettingsUsersSection.tsx` | `MANAGE_USERS` (Invite User button) |
| `SettingsUserProfileModal.tsx` | `RESET_PASSWORD`, `RESET_PIN`, `FORCE_LOGOUT`, `SUSPEND_USERS`, `ENABLE_MFA` |

**Total UI surfaces with `PermissionGate`:** 2 files, 6 action gates.

---

## Action matrix (existing permissions)

| Action | Permission ID | Page/route protected? | Action gated? | Gap |
|--------|---------------|----------------------|---------------|-----|
| **Create** (register borrower) | `REGISTER_BORROWERS` | Yes ÔÇö officer portal | No `PermissionGate` on wizard submit | Route-only |
| **Edit** (borrower / pending) | `EDIT_BORROWERS`, `EDIT_PENDING_REGISTRATIONS` | Partial ÔÇö portal routes | No action gates | Route-only |
| **Delete** (registration) | `EDIT_PENDING_REGISTRATIONS` | Officer routes | No `PermissionGate` | Route-only |
| **Approve** (borrower) | `APPROVE_BORROWERS` | Approver portal | No `PermissionGate` on approve buttons | Route-only |
| **Reject** (borrower) | implied by approver role | Approver portal | No `PermissionGate` | Route-only |
| **Export** (reports, profiles) | `EXPORT_REPORTS` | Reports routes (auditor/admin) | `WilmsExportActions` has **no** permission check | **Exposed within permitted routes only** |
| **Print** | same as export | Same | No `PermissionGate` on print handlers | Route-only |
| **Assign** (collector to group) | `MANAGE_GROUPS` | `/groups` routes | No `PermissionGate` on reassign UI | Route-only |
| **Suspend** (users) | `SUSPEND_USERS` | Settings (admin) | **Gated** in profile modal | Modal actions outside gate still in edit flow |
| **Reset PIN** | `RESET_PIN` | Settings | **Gated** in profile modal | ÔÇö |
| **Reset Password** | `RESET_PASSWORD` | Settings | **Gated** in profile modal | ÔÇö |
| **Flag group** | `MANAGE_GROUPS` (route) | `/groups` | No `PermissionGate` on Flag button | Route-only |
| **Replace leader** | `MANAGE_GROUPS` + role rules | `/groups` | UI: `canManageGroupLeader()`; service: mock enforcement added P12 | UI + mock service |
| **Edit display name** | `MANAGE_GROUPS` | `/groups` | **Gated** ÔÇö `GroupDisplayNameSection.tsx` | ÔÇö |
| **Record collection** | `RECORD_COLLECTIONS` | Collector portal | No action gate | Route-only |
| **Record expense** | `RECORD_EXPENSES` | Collector portal | No action gate | Route-only |
| **Manage settings** | `MANAGE_SYSTEM_SETTINGS` | Settings routes | Section visibility by role; no per-field gates except group size for super admin | Partial |

---

## Protected vs exposed summary

| Layer | Coverage |
|-------|----------|
| Portal layouts | All 5 role shells guarded |
| Nav links | Filtered by permission map |
| Destructive admin actions (reset PIN/password, suspend, force logout, MFA) | Gated in user profile modal |
| Invite user | Gated in users section |
| Group display name edit | Gated in P12 |
| All other create/edit/approve/export/print/assign flows | **Route access only** ÔÇö no `PermissionGate` on individual buttons |

---

## Recommendations (no changes made ÔÇö audit only)

Roll out existing `PermissionGate` to high-risk actions if fine-grained RBAC is required beyond portal boundaries:

1. `WilmsExportActions` ÔÇö wrap with `EXPORT_REPORTS` where reports are auditor-scoped
2. Approval actions ÔÇö `APPROVE_BORROWERS` / `REJECT_LOANS`
3. Group mutations ÔÇö `MANAGE_GROUPS` on flag/reassign/membership panels
4. User edit modal suspend/delete ÔÇö extend gates already used in profile modal

No new permission IDs required; rollout of existing constants only.
