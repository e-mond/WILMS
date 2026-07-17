# WILMS Permission Matrix

**Source of truth:** `packages/shared-rbac` (`role-permissions.ts`, `permissions.ts`)  
**Date:** 17 July 2026  
**Note:** Super Admin receives all permissions. Effective permissions may include per-user grants/revokes.

| Permission | Collector | Registration Officer | Approver | Auditor | Super Admin |
|---|---|---|---|---|---|
| access-admin-portal | | | | | ✓ |
| access-collector-portal | ✓ | | | | ✓ |
| access-registration-portal | | ✓ | | | ✓ |
| access-approver-portal | | | ✓ | | ✓ |
| access-auditor-portal | | | | ✓ | ✓ |
| register-borrowers | ✓ | ✓ | | | ✓ |
| edit-borrowers | | ✓ | | | ✓ |
| edit-pending-registrations | | ✓ | | | ✓ |
| capture-documents | ✓ | ✓ | | | ✓ |
| upload-signatures | ✓ | ✓ | | | ✓ |
| gps-verification | | ✓ | | | ✓ |
| manage-groups | | | | | ✓ |
| view-assigned-borrowers | ✓ | | | | ✓ |
| record-collections | ✓ | | | | ✓ |
| record-expenses | ✓ | | | | ✓ |
| view-reports | | | | ✓ | ✓ |
| view-financial-reports | | | | | ✓ |
| export-reports | | | | ✓ | ✓ |
| review-applications | | | ✓ | | ✓ |
| approve-borrowers | | | ✓ | | ✓ |
| approve-loans | | | ✓ | | ✓ |
| reject-loans | | | ✓ | | ✓ |
| review-risk-flags | | | ✓ | ✓ | ✓ |
| view-audit-log | | | | ✓ | ✓ |
| view-audit-history | | | | | ✓ |
| view-all-users | | | | | ✓ |
| edit-users | | | | | ✓ |
| manage-users | | | | | ✓ |
| reset-password | | | | | ✓ |
| reset-pin | | | | | ✓ |
| suspend-users | | | | | ✓ |
| activate-users | | | | | ✓ |
| assign-permissions | | | | | ✓ |
| assign-roles | | | | | ✓ |
| delegate-authority | | | | | ✓ |
| force-logout | | | | | ✓ |
| enable-mfa | | | | | ✓ |
| manage-roles | | | | | ✓ |
| manage-system-settings | | | | | ✓ |
| manage-expenses | | | | | ✓ |
| view-all-collectors | | | | | ✓ |
| manage-communications | | | | | ✓ |
| view-communication-analytics | | | | | ✓ |
| manage-communication-scheduler | | | | | ✓ |
| send-broadcast | | | | | ✓ |

## SoD highlights

- Collectors **do not** have `manage-groups` (removed in v1.3.8 remediation).
- Auditors have report/audit visibility but **not** `access-admin-portal` (blocks reconciliation review mutation).
- Reconciliation review requires `access-admin-portal` (Super Admin).

When this table drifts from code, **trust the package** and regenerate this file.
