# Role Certification Report — v1.3.6-rc1

**Date:** 2026-07-12  
**Method:** Code review + existing E2E/unit coverage (no fabricated role walkthroughs)

---

## Roles verified via automated coverage

| Role | Landing | Key paths | E2E / unit evidence |
|------|---------|-----------|---------------------|
| Super Admin | `/dashboard` | Collectors, groups, reports, settings | `p13-workflows`, `shell-navbar`, `accessibility` |
| Collector | `/collector/dashboard` | Settings, app lock, payments | `app-lock.spec.ts`, `collector-shell` |
| Registration Officer | `/officer/register` | Registration wizard | `p13-workflows` |
| Approver | `/approver/pending` | Pending queue | `p13-workflows`, `accessibility` |
| Auditor | `/auditor/reports` | Reports | Route constants + RBAC matrix |

## v1.3.6 role-specific changes

| Role | Change |
|------|--------|
| Collector | Settings: single **App Lock** entry (PIN duplicate removed) |
| Super Admin | Collectors page messaging fixed for all collector user id formats |

## Privilege escalation

No RBAC matrix changes in this RC. Existing `PermissionGate` and API `requireAuth` unchanged.

## Partial / requires production credentials

| Check | Status |
|-------|--------|
| `smoke:rbac` admin-login | Requires `WILMS_SMOKE_*` in deploy environment |
| Group Leader / Borrower portals | Not primary WILMS office roles — out of RC scope |

## Certification

Role-specific fixes verified. Full production role certification requires post-deploy smoke with live credentials.
