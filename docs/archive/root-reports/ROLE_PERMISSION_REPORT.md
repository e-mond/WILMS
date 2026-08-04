# Role & Permission Report — v1.2.3

## Module Status

The Roles & Permissions module in Settings provides:

| Capability | Status |
|------------|--------|
| Create role | Supported |
| Edit role | Supported |
| Clone role | Supported |
| Delete role | Supported (system roles protected) |
| Assign / remove permissions | Supported |
| Role search & filters | Supported via Settings UI |
| Permission categories & groups | Defined in RBAC package |
| Permission matrix preview | Settings role editor |
| Role usage counts | Displayed per role |
| RBAC enforcement | Middleware + `PermissionGate` on frontend |

## Protected System Roles

`isSystem: true` roles cannot be deleted. Super Admin, Collector, Registration Officer, Approver, and Auditor seed roles are marked system.

## Session & RBAC Interaction

Role changes bump `session_version`, forcing re-authentication on next API request. Smoke test `smoke:rbac` validates collector/officer/admin boundary enforcement.
