# WILMS — Stage 2 Role Certification

**Audit stage:** 2 (Role Certification)  
**Date:** 2026-07-10  
**Repository:** `e-mond/WILMS`  
**Git ref audited:** `main` @ `1845f77` (includes Stage 0 `BASELINE.md` and Stage 1 `SECURITY_ASSESSMENT_REPORT.md` via PRs #75–#76)  
**Method:** Static mapping of `@wilms/shared-rbac`, backend route middleware, frontend portal guards, and resource-scoping helpers; local Vitest RBAC tests and in-process HTTP probes; production BFF smoke (`smoke:rbac`). **No code changes were made as part of this stage.**

---

## Executive summary

WILMS defines **five authenticated staff roles** in code. There are **no login roles** for Administrator (mapped to Super Admin), Group Leader (group membership role only), or Borrower (domain entity). API permission enforcement uses the **static** `shared-rbac` matrix keyed on `session.role`; the Settings UI persists custom roles to PostgreSQL, but that data is **not** consulted by `requirePermission` middleware.

**Certified (verified):** Collector self-access scoping (`assertCollectorAccess`), cross-portal denial for collector/officer vs admin dashboard (local tests + production smoke), financial mutation blocks (Stage 1 security harness 11/11), and portal layout guards on all five role shells.

**Gaps (verified):** Several high-value read endpoints require only `requireAuth` (not `requirePermission`), allowing any logged-in role to list all borrowers and run global search. DB-edited role permissions do not affect API authorization. Frontend `ROLE_DEFINITIONS` for Collector omits two permissions present in `shared-rbac`.

---

## 1. Role inventory

### 1.1 Authenticated staff roles (first-class)

| Code enum | UI label | Portal home (`getPortalHomePath`) | Layout guard |
|-----------|----------|-----------------------------------|--------------|
| `SUPER_ADMIN` | Super Admin | `/dashboard` | `(super-admin)/layout.tsx` → `RoleGuard` |
| `COLLECTOR` | Collector | `/collector/dashboard` | `(collector)/layout.tsx` |
| `REGISTRATION_OFFICER` | Registration Officer | `/officer/register` | `(registration-officer)/` |
| `APPROVER` | Approver | `/approver/pending` | `(approver)/layout.tsx` |
| `AUDITOR` | Auditor | `/auditor/reports` | `(auditor)/layout.tsx` |

**Sources:** `packages/shared-rbac/src/roles.ts` L1–24; `apps/frontend/src/lib/rbac/permission-matrix.ts` L78–91; `apps/frontend/src/components/auth/RoleGuard.tsx` L9–15.

### 1.2 Names from Stage 0 scope — mapping

| Name (audit scope) | Auth role? | Verified mapping |
|--------------------|------------|------------------|
| **Administrator** | No separate enum | Equivalent to **`SUPER_ADMIN`** (`ROLE_LABELS`: "Super Admin"). Settings "Manage users/roles" permissions align with admin portal. |
| **Group Leader** | No | **Group membership role** `GROUP_MEMBER_ROLE.LEADER` in `apps/frontend/src/types/group.ts` L10–15. Managed via group profile UI (`GroupMembershipManagement.tsx`); not used in `requirePermission` or login. |
| **Borrower** | No | **Domain entity** (`borrowers` table, `BORROWER_STATUS` in contracts). No borrower login flow or `USER_ROLE` value found. |

### 1.3 Permission count

| Item | Count | Source |
|------|-------|--------|
| Permission constants | **49** | `packages/shared-rbac/src/permissions.ts` |
| Roles with static matrix | **5** | `packages/shared-rbac/src/role-permissions.ts` |
| Frontend route prefix rules | **15** | `ROUTE_PERMISSION_REQUIREMENTS` in `permission-matrix.ts` L41–57 |
| Nav href permission map | **28** | `NAV_ITEM_PERMISSIONS` L95–124 |

---

## 2. Canonical permission matrix (shared-rbac)

Permissions per role from `packages/shared-rbac/src/role-permissions.ts`:

| Permission category | SUPER_ADMIN | COLLECTOR | REGISTRATION_OFFICER | APPROVER | AUDITOR |
|---------------------|:-----------:|:---------:|:--------------------:|:--------:|:-------:|
| Portal access (5) | all | collector | registration | approver | auditor |
| `register-borrowers` | ✓ | ✓ | ✓ | — | — |
| `edit-borrowers` | ✓ | — | ✓ | — | — |
| `edit-pending-registrations` | ✓ | — | ✓ | — | — |
| `capture-documents` / `upload-signatures` | ✓ | ✓ | ✓ | — | — |
| `gps-verification` | ✓ | — | ✓ | — | — |
| `manage-groups` | ✓ | ✓ | — | — | — |
| `view-assigned-borrowers` | ✓ | ✓ | — | — | — |
| `record-collections` / `record-expenses` | ✓ | ✓ | — | — | — |
| `review-applications` / `approve-borrowers` | ✓ | — | — | ✓ | — |
| `approve-loans` / `reject-loans` | ✓ | — | — | ✓ | — |
| `review-risk-flags` | ✓ | — | — | ✓ | ✓ |
| `view-reports` / `export-reports` | ✓ | — | — | — | ✓ |
| `view-audit-log` | ✓ | — | — | — | ✓ |
| `view-financial-reports` | ✓ | — | — | — | — |
| Admin-only (users, roles, settings, comms, etc.) | ✓ | — | — | — | — |

`SUPER_ADMIN` receives `Object.values(PERMISSION)` (all 49). No other role receives `view-financial-reports`, `manage-expenses`, or administration permissions.

---

## 3. Enforcement architecture

### 3.1 Backend

```
Request → requireAuth → requirePermission(...) → handler
                ↓
         session.role → roleHasPermission() → shared-rbac matrix
```

- **Middleware:** `apps/backend/src/middleware/require-permission.ts` L5–22 — 401 if no session; 403 if no matching permission (OR semantics when multiple permissions passed).
- **Matrix source:** Re-export from `@wilms/shared-rbac` via `apps/backend/src/infrastructure/permissions/matrix.ts`.
- **Session role:** Encoded in HMAC token; validated against `users.role` enum on each request (`assertSessionActive`, `session.service.ts` L51–88).

### 3.2 Frontend

- **Route guard:** `PermissionRouteGuard` checks `hasAnyPermission` and redirects to portal home (`permission-matrix.ts` L78–91).
- **Layout:** `RoleGuard` maps each `USER_ROLE` to one portal permission (`RoleGuard.tsx` L9–15).
- **UI gates:** `PermissionGate` hides actions; **not** a security boundary (API must enforce).
- **Permission resolution:** `PermissionProvider` uses `resolveUserPermissionIds` → `ROLE_DEFINITIONS` in `apps/frontend/src/constants/rbac-roles.ts`, **not** the Settings API at runtime.

### 3.3 Database RBAC (Settings module)

| Table | Purpose | Used by API `requirePermission`? |
|-------|---------|----------------------------------|
| `roles`, `role_permissions` | Custom role CRUD in Settings | **No** |
| `user_roles` | User ↔ role assignment | **No** (users.role enum used instead) |
| `user_permission_overrides` | Per-user grant/revoke | **No** (frontend `OVERRIDE_STORE` is in-memory empty stub) |

**Evidence:** `settings/service.ts` L703–744 loads DB roles for Settings UI; `require-permission.ts` L12–13 calls `roleHasPermission(req.session!.role, permission)` only. `user_permission_overrides` referenced only in `purge.service.ts`.

---

## 4. Verified findings

### 4.1 Positive — role boundaries enforced

| ID | Finding | Severity | Evidence |
|----|---------|----------|----------|
| R2-P01 | Collector cannot access another collector's dashboard | Pass | `collector-portal/access.ts` L19–23; Vitest `rbac.test.ts` — 403 for other ID |
| R2-P02 | Registration officer blocked from collector dashboard | Pass | `rbac.test.ts` — 403 |
| R2-P03 | Collector blocked from loan approve/disburse/reverse | Pass | Stage 1 `security-checks.ts` — 403 on approve, disburse, reverse |
| R2-P04 | Officer blocked from posting payments | Pass | `security-checks.ts` — 403 |
| R2-P05 | Auditor can post audit entries; collector cannot | Pass | `security-checks.ts` — auditor 201, collector 403 |
| R2-P06 | Admin dashboard requires `ACCESS_ADMIN_PORTAL` | Pass | `dashboard/routes.ts` L15; auditor probe → 403 |
| R2-P07 | Five portal layouts use `RoleGuard` | Pass | `(collector|approver|auditor|super-admin)/layout.tsx`, registration officer client layout |
| R2-P08 | Role change invalidates sessions | Pass | `settings/service.ts` calls `invalidateUserSessions`; `session.service.ts` L76–78 |

### 4.2 Gaps — permission or scope deficiencies

| ID | Finding | Severity | Location | Impact |
|----|---------|----------|----------|--------|
| R2-G01 | **`GET /borrowers` lacks `requirePermission`** | High | `borrowers/routes.ts` L49–60 | Any authenticated role (collector, auditor, approver) can list **all** borrower summaries; `?status=PENDING` exposes full pending queue without `REVIEW_APPLICATIONS`. **Runtime:** collector and auditor → HTTP 200 (local probe 2026-07-10). |
| R2-G02 | **Borrower detail scoping skips collector/auditor** | Medium | `borrowers/access.ts` L9–15 | `assertBorrowerReadAccess` only restricts `REGISTRATION_OFFICER` to own registrations; collector/auditor/approver pass through to any `:id`. |
| R2-G03 | **Group-formation routes auth-only** | Medium | `group-formation/routes.ts` L13–33 | `GET /groups/formation/config`, `POST .../process-approval` require login only. Collector/auditor reach config (200). |
| R2-G04 | **`GET /search` auth-only** | Medium | `search/routes.ts` L9–24 | Any authenticated user can run global search. Collector probe → 200. |
| R2-G05 | **Messages routes auth-only** | Low | `messages/routes.ts` L36–64 | Thread ACL in service layer only; no permission constant. |
| R2-G06 | **DB role edits do not affect API** | High | `require-permission.ts` vs `settings/service.ts` | Admin can edit `role_permissions` in Settings; API still uses static matrix. Custom roles in DB have no effect on authorization. |
| R2-G07 | **Frontend Collector role missing 2 permissions** | Medium | `rbac-roles.ts` L57–64 vs `role-permissions.ts` L6–14 | UI matrix omits `capture-documents`, `upload-signatures`; backend grants them to collectors. API allows capture sessions (`rbac.test.ts` 201); UI gates may hide related affordances. |
| R2-G08 | **Approver cannot `GET /loans` list** | Low (by design) | `loans/routes.ts` L37–39 vs `role-permissions.ts` L25–31 | Approver has `approve-loans` but not `view-financial-reports`; list blocked (403). Approver workflow uses `/borrowers/loan-eligible` (`APPROVE_LOANS`) instead. |
| R2-G09 | **Borrower PII check endpoints auth-only** | Medium | `borrowers/routes.ts` L84–127 | `check-phone`, `check-id`, `check-blacklist`, `check-guarantor-eligibility` — any logged-in role. |
| R2-G10 | **`GET /borrowers/awaiting-admin-fee` auth-only** | Medium | `borrowers/routes.ts` L216–221 | Financial queue visible to all authenticated roles. |

### 4.3 Informational — drift and design notes

| ID | Finding | Evidence |
|----|---------|----------|
| R2-I01 | `ROLE_DEFINITIONS.userCount` values are static placeholders | `rbac-roles.ts` L66, L82, etc. (e.g. `userCount: 34`) |
| R2-I02 | `MANAGE_EXPENSES` (approve/list all expenses) is super-admin only | `expenses/routes.ts` L21–47; collectors use `RECORD_EXPENSES` |
| R2-I03 | Collectors can hit `GET /collectors` via permission OR-list | `collectors/routes.ts` L36–41 includes `VIEW_REPORTS` — auditors can list collectors |
| R2-I04 | Organization holidays readable by collector/approver/auditor | `organization-holidays/routes.ts` L28–33 — intentional broad read |

---

## 5. Role × portal certification

| Role | Expected portal | Frontend guard | API portal permission | Cross-portal block verified |
|------|-----------------|----------------|----------------------|----------------------------|
| SUPER_ADMIN | `/dashboard`, admin modules | ✓ | `ACCESS_ADMIN_PORTAL` | Not fully probed (admin login failed in smoke) |
| COLLECTOR | `/collector/*` | ✓ | `ACCESS_COLLECTOR_PORTAL` | ✓ — admin dashboard 403 (prod smoke + local) |
| REGISTRATION_OFFICER | `/officer/*` | ✓ | `ACCESS_REGISTRATION_PORTAL` | ✓ — dashboard 403 (prod smoke) |
| APPROVER | `/approver/*` | ✓ | `ACCESS_APPROVER_PORTAL` | Static only |
| AUDITOR | `/auditor/*` | ✓ | `ACCESS_AUDITOR_PORTAL` | ✓ — dashboard 403 (local); reports 200 |

---

## 6. Verified runtime evidence

### 6.1 Local Vitest — collector portal RBAC

**Command:** `npm run test -w @wilms/api -- src/tests/collector-portal/`  
**Date:** 2026-07-10  
**Result:** **10/10 passed** (access.test.ts 4 + rbac.test.ts 6)

| Test | Result |
|------|--------|
| Own collector dashboard | 200 |
| Other collector dashboard | 403 |
| Officer on collector dashboard | 403 |
| Collector notification unread count | 200 |
| Collector create capture session | 201 |
| Collector disbursement eligibility | 403 |

### 6.2 Local HTTP probes (in-process, no DB)

**Date:** 2026-07-10

| Probe | Status | Expected RBAC behavior |
|-------|--------|------------------------|
| Auditor `GET /borrowers` | **200** | Confirms R2-G01 — should require permission |
| Collector `GET /borrowers` | **200** | Confirms R2-G01 |
| Collector `GET /borrowers?status=PENDING` | **200** | Pending queue without approver permission |
| Approver `GET /loans` | **403** | Correct — lacks `view-financial-reports` |
| Auditor `GET /dashboard/summary` | **403** | Correct |
| Auditor `GET /reports/daily-collection` | **200** | Correct — has `view-reports` |
| Collector `GET /groups/formation/config` | **200** | Confirms R2-G03 |
| Collector `GET /search?q=test` | **200** | Confirms R2-G04 |

### 6.3 Production BFF smoke (`smoke:rbac`)

**Command:** `WILMS_APP_URL=https://wilms.vercel.app npx tsx src/verification/rbac-production-smoke.ts`  
**Date:** 2026-07-10  
**Result:** **7/8 checks passed**

| Check | Result |
|-------|--------|
| admin-login (`admin@wilms.demo`) | **FAIL** — credentials rejected |
| collector-login | PASS |
| collector own dashboard | 200 |
| collector blocked admin dashboard | 403 |
| collector blocked settings/users | 403 |
| collector reconciliation | 200 |
| officer-login | PASS |
| officer blocked dashboard | 403 |

Stage 1 security harness (**11/11**) is cited for financial RBAC mutations; not re-run in this stage.

---

## 7. Not verified

| Item | Reason |
|------|--------|
| Super Admin full portal/API matrix | Demo admin login failed in production smoke; no staging credentials |
| Approver cross-portal API probes | Not exercised in dynamic harness this session |
| Custom DB role → API behavior after Settings edit | Requires DB-backed deploy + controlled user |
| `user_permission_overrides` end-to-end | Table unused by middleware; frontend override store empty |
| Group Leader borrower-facing flows | No auth role; group APIs use `MANAGE_GROUPS` (collector/admin) |
| Borrower self-service | No borrower auth exists |
| `cert:reconciliation:rbac` | Requires `DATABASE_URL` + seed actors (gated) |
| Per-route IDOR on loans/payments/uploads with live data | No production role tokens in agent env |

---

## 8. Recommendations (no fixes applied)

| Priority | Recommendation | Related |
|----------|----------------|---------|
| P0 | Add `requirePermission` to `GET /borrowers` (e.g. `VIEW_ASSIGNED_BORROWERS` for collectors with server-side filter, `REVIEW_APPLICATIONS` for pending, admin/auditor rules explicit) | R2-G01 |
| P0 | Wire API `requirePermission` to DB role permissions (or remove editable matrix from Settings until wired) | R2-G06 |
| P1 | Extend `assertBorrowerReadAccess` for collectors (assigned borrowers only) and auditors (read-only policy) | R2-G02 |
| P1 | Add `requirePermission` to group-formation, search, and borrower check endpoints | R2-G03, R2-G04, R2-G09 |
| P1 | Sync frontend `ROLE_DEFINITIONS` with `shared-rbac` (add `capture-documents`, `upload-signatures` to collector) | R2-G07 |
| P2 | Document approver loan-read path (`/borrowers/loan-eligible` vs `GET /loans`) for operators | R2-G08 |
| P2 | Re-enable or rotate demo admin credentials for smoke:rbac admin checks | Production smoke gap |

---

## 9. Stage boundary

This deliverable completes **Stage 2 only**. Stages 3–8 and Stage 4.5 were not started. No remediation code was committed.

**Prior stages:** Stage 0 `BASELINE.md`, Stage 1 `SECURITY_ASSESSMENT_REPORT.md`  
**Next stage:** Stage 3 — User Flow Certification → `USER_FLOW_CERTIFICATION.md`
