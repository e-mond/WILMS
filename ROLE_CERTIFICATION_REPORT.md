# ROLE_CERTIFICATION_REPORT.md

**Project:** WILMS  
**Date:** 2026-07-11  
**Source of truth:** `packages/shared-rbac/src/`

---

## 1. Role Model

WILMS defines **five authenticated login roles**. The audit brief lists Administrator, Group Leader, and Borrower — these are **not** login roles in the codebase.

| Audit name | Codebase mapping | Portal access |
|------------|------------------|---------------|
| Super Admin | `USER_ROLE.SUPER_ADMIN` | All portals + admin |
| Administrator | **No separate role** — Super Admin | Same as Super Admin |
| Collector | `USER_ROLE.COLLECTOR` | Collector portal |
| Registration Officer | `USER_ROLE.REGISTRATION_OFFICER` | Registration portal |
| Approver | `USER_ROLE.APPROVER` | Approver portal |
| Auditor | `USER_ROLE.AUDITOR` | Auditor portal |
| Group Leader | **Not a login role** — group member designation | N/A |
| Borrower | **Not a login role** — loan entity | N/A |

Evidence: `packages/shared-rbac/src/roles.ts`

---

## 2. Permission Matrix

46 permissions defined in `packages/shared-rbac/src/permissions.ts`.  
Role grants in `packages/shared-rbac/src/role-permissions.ts`.

### 2.1 Portal Access

| Permission | Super Admin | Collector | Reg. Officer | Approver | Auditor |
|------------|:-----------:|:---------:|:------------:|:--------:|:-------:|
| `access-admin-portal` | ✓ | | | | |
| `access-collector-portal` | ✓ | ✓ | | | |
| `access-registration-portal` | ✓ | | ✓ | | |
| `access-approver-portal` | ✓ | | | ✓ | |
| `access-auditor-portal` | ✓ | | | | ✓ |

### 2.2 Registration & Capture

| Permission | Super Admin | Collector | Reg. Officer | Approver | Auditor |
|------------|:-----------:|:---------:|:------------:|:--------:|:-------:|
| `register-borrowers` | ✓ | ✓ | ✓ | | |
| `edit-borrowers` | ✓ | | ✓ | | |
| `edit-pending-registrations` | ✓ | | ✓ | | |
| `capture-documents` | ✓ | ✓ | ✓ | | |
| `upload-signatures` | ✓ | ✓ | ✓ | | |
| `gps-verification` | ✓ | | ✓ | | |

**Capture session note:** `CAPTURE_DOCUMENTS` required for session **creation** (desktop). Mobile **lookup/upload** is token-gated without login (by design). Pre-fix: router order caused 401 — RBAC was not the blocker.

### 2.3 Collections

| Permission | Super Admin | Collector | Reg. Officer | Approver | Auditor |
|------------|:-----------:|:---------:|:------------:|:--------:|:-------:|
| `manage-groups` | ✓ | ✓ | | | |
| `view-assigned-borrowers` | ✓ | ✓ | | | |
| `record-collections` | ✓ | ✓ | | | |
| `record-expenses` | ✓ | ✓ | | | |

### 2.4 Approval

| Permission | Super Admin | Collector | Reg. Officer | Approver | Auditor |
|------------|:-----------:|:---------:|:------------:|:--------:|:-------:|
| `review-applications` | ✓ | | | ✓ | |
| `approve-borrowers` | ✓ | | | ✓ | |
| `approve-loans` | ✓ | | | ✓ | |
| `reject-loans` | ✓ | | | ✓ | |
| `review-risk-flags` | ✓ | | | ✓ | ✓ |

### 2.5 Reports & Audit

| Permission | Super Admin | Collector | Reg. Officer | Approver | Auditor |
|------------|:-----------:|:---------:|:------------:|:--------:|:-------:|
| `view-reports` | ✓ | | | | ✓ |
| `view-financial-reports` | ✓ | | | | |
| `export-reports` | ✓ | | | | ✓ |
| `view-audit-log` | ✓ | | | | ✓ |

### 2.6 Administration (Super Admin only in defaults)

Includes: `manage-users`, `edit-users`, `suspend-users`, `assign-roles`, `manage-system-settings`, `force-logout`, `manage-communications`, `send-broadcast`, and 12 others — all granted only to `SUPER_ADMIN` in default matrix.

---

## 3. Enforcement Layers

| Layer | Mechanism | File |
|-------|-----------|------|
| API permission | `requirePermission(...)` | `require-permission.ts` |
| API auth | `requireAuth` | `authenticate.ts` |
| Resource IDOR | `assertCollectorAccess`, borrower access | `collector-portal/access.ts`, `borrowers/access.ts` |
| DB overrides | Per-user grants/revokes | `resolve-user-permissions.ts` |
| Frontend routes | `ROUTE_PERMISSION_REQUIREMENTS` | `permission-matrix.ts` |
| Frontend middleware | `canRoleAccessPath` | `routes.ts`, `middleware.ts` |
| UI gates | `PermissionGate`, `RoleGuard` | `PermissionGate.tsx`, `RoleGuard.tsx` |

---

## 4. Automated RBAC Verification

| Test | Result | Evidence |
|------|--------|----------|
| `collector-portal/rbac.test.ts` | **6/6 PASS** | Collector self-access, cross-collector block, capture create not 403 |
| `security-checks.ts` | Included in backend 100/100 | 401/403/422 checks |
| `smoke:rbac` | Not verified—requires runtime | `rbac-production-smoke.ts` — needs `WILMS_APP_URL` |

Historical production result (from prior report): 7/8 — admin login probe failed due to credentials/env, not permission bypass.

---

## 5. IDOR Protection

| Resource | Guard | Verified |
|----------|-------|----------|
| Collector dashboard | `assertCollectorAccess` — role + userId match | PASS — rbac.test.ts |
| Borrower records | `assertBorrowerAccess` patterns | PARTIAL — code review |
| Capture sessions | Token is capability bearer; no user ID in URL | PASS — by design |
| Upload content | Purpose ACL + auth on standard uploads | PASS |

---

## 6. Menu & Route Visibility

| Role | Shell | Route prefix | Evidence |
|------|-------|--------------|----------|
| Super Admin | `SuperAdminShell` | `/dashboard`, `/settings`, ... | `navigation.ts` |
| Collector | `CollectorShell` | `/collector/*` | Layout + middleware |
| Reg. Officer | `RegistrationOfficerShell` | `/officer/*` | Layout + middleware |
| Approver | `ApproverShell` | `/approver/*` | Layout + middleware |
| Auditor | Role-specific or reports | `/auditor/*`, reports | `permission-matrix.ts` |

---

## 7. Findings

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| RBAC-01 | P0 | Public capture route unreachable (not RBAC misconfig) | FIXED — router order |
| RBAC-02 | P2 | Group Leader / Borrower listed in audit but not login roles | DOCUMENTED |
| RBAC-03 | P2 | `RoleGuard` legacy vs `PermissionRouteGuard` | OPEN — layouts still use RoleGuard |

---

## 8. Certification

| Aspect | Status |
|--------|--------|
| Permission matrix completeness | PASS — 46 permissions, 5 roles |
| API enforcement | PASS — automated tests |
| UI enforcement | PARTIAL — PermissionGate + middleware; not all panels tested |
| Production RBAC smoke | NOT VERIFIED — requires deployed env |
| IDOR on collector portal | PASS — unit tests |

**Overall:** **PARTIAL** — code and unit tests certify RBAC logic; production `smoke:rbac` required for full PASS.
