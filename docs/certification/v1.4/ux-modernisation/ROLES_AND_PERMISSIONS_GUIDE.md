# Roles & Permissions — How Assignment Works

**Audience:** Super Admins  
**Version:** 1.4.1+

## Concepts

| Concept | Meaning |
|---------|---------|
| **Permission** | A single capability (e.g. “Record collections”) |
| **Role** | A named bundle of permissions (Collector, Approver, …) |
| **User** | A person who holds one primary role |
| **Override** | A grant or revoke for one user that differs from their role |

Effective permissions = **role permissions ± user overrides**. The API enforces this; the UI only reflects it.

## Assign via role (default)

1. Open **Settings → Roles**.
2. Clone or edit a role’s permission set (`MANAGE_ROLES`).
3. Every user with that role receives the updated set after session refresh.

Use this when **all** people in a job function need the same access.

## Assign to one user (override)

1. Open **Settings → Users**.
2. Open the user’s profile.
3. Use **Permission overrides** (`ASSIGN_PERMISSIONS`).
4. Choose **Grant** (add a permission outside the role) or **Revoke** (remove a role permission for this user only).

Rules enforced by the API (HTTP 422 if violated):

- **Grant** only permissions the role does **not** already include.
- **Revoke** only permissions the role **does** include.
- Super Admin’s role includes every permission, so only **Revoke** is available for those users.

Use this for exceptions (e.g. one Collector who may also view a report) without widening the whole Collector role.

## Permission Catalog

Settings → Roles → **Permission Catalog** lists all permissions **grouped by category** (Portal, Registration, Collections, Finance, …). Human labels are primary; technical keys are copyable secondary metadata.

## Operations page vs Dashboard

| Page | Who | Purpose |
|------|-----|---------|
| `/dashboard` | Super Admin (day-to-day) | Portfolio KPIs |
| `/ops` | Super Admin (operators) | Platform health — optional for product users who never touch infra |

Collectors, officers, approvers, and auditors do **not** see `/ops`.
