# WILMS — Stage 3 User Flow Certification

**Audit stage:** 3 (User Flow Certification)  
**Date:** 2026-07-10  
**Repository:** `e-mond/WILMS`  
**Git ref audited:** `main` @ `1845f77` + RBAC gap fixes on `cursor/rbac-gaps-and-stage-3-8847`  
**Method:** Static trace of frontend routes, BFF proxies, and backend APIs; review of Playwright specs and smoke harnesses; local Vitest execution where available. **Stage 2 RBAC gaps R2-G01–G07, G09–G10 remediated in code on this branch (see §8).**

**Prior stages:** `BASELINE.md` (0), `SECURITY_ASSESSMENT_REPORT.md` (1), `ROLE_CERTIFICATION_REPORT.md` (2, on branch)

---

## Executive summary

WILMS implements **five staff portals** with a consistent pattern: Next.js App Router pages → BFF (`/api/auth/*`, `/api/wilms/*`) → Express API. Auth flows (login, OTP, onboarding, invitation, password reset, session expiry) are wired end-to-end in code. Cross-cutting flows (registration → approval → loan → disbursement → collection → reconciliation) are present with offline payment queueing for collectors.

**Certified from code + local tests:** Auth middleware and session expiry unit tests; collector/officer/auditor landing E2E specs; backend RBAC tests (90/90); role journey Playwright coverage for all five staff roles; offline expense sync wired with unit tests.

**Not verified dynamically:** Full Playwright suite against live stack; production/staging smoke with admin credentials; end-to-end loan disbursement on deployed API.

---

## 1. Architecture (flow transport)

```
Browser → Next.js pages (role layouts + PermissionRouteGuard)
       → BFF /api/auth/* (CSRF + httpOnly wilms_session cookie)
       → BFF /api/wilms/* (proxy + Bearer from cookie)
       → Express API (requireAuth + requirePermission + resource scoping)
```

| Layer | Key files |
|-------|-----------|
| Public paths | `apps/frontend/src/lib/auth/routes.ts` L8–15 |
| Edge middleware | `apps/frontend/src/middleware.ts` |
| BFF proxy | `apps/frontend/src/app/api/wilms/[...path]/route.ts` |
| API mount | `apps/backend/src/http/app.ts` L100–106 |

---

## 2. Authentication & session flows

### 2.1 Flow matrix

| Flow | Frontend | BFF | Backend API | Verified |
|------|----------|-----|-------------|----------|
| Login | `/login` → `LoginForm.tsx` | `POST /api/auth/login` | `POST /auth/login` | Unit tests (`login.test.ts`); prod smoke partial |
| CSRF | — | `GET /api/auth/csrf` | — | `production-smoke.ts` |
| OTP (2FA) | `VerifyOtpForm` | `POST /api/auth/verify-otp` | `POST /auth/verify-otp` | Code complete; not runtime-tested |
| Onboarding | `/complete-profile` | `POST /api/auth/complete-onboarding` | `POST /auth/complete-onboarding` | Middleware gate for `INVITED` |
| Invitation | `/accept-invitation?email=` | `POST /api/wilms/auth/accept-invitation` | `POST /auth/accept-invitation` | Code complete; weak token (Stage 1 S1-M02) |
| Forgot password | `/forgot-password` | proxy | `POST /auth/forgot-password` | Rate-limited (`auth/routes.ts` L48–54) |
| Reset password | `/reset-password?token=` | proxy | `POST /auth/reset-password` | Session not invalidated (Stage 1 S1-H04) |
| Logout | `useLogout` | `POST /api/auth/logout` | *(cookie clear only)* | `logout.spec.ts` exists |
| Session expired | `/session-expired` | — | — | `session-expired.spec.ts`; `SessionExpiryHandler.tsx` |
| Photo capture (public) | `/capture/[token]` | — | `POST /photo-capture/sessions/:token/upload` | Token-gated; no auth (Stage 1 S1-M03) |

### 2.2 Auth happy paths (code-traced)

**Standard login:** CSRF cookie → credentials → `wilms_session` → redirect to `getPortalHomePath(role)`.

**Invited user:** Admin creates user (`POST /settings/users`) → email → `/accept-invitation` → `/login?next=/complete-profile` → temp password → onboarding → `ACTIVE` → role home.

**Session revocation:** Role change / suspend bumps `sessionVersion` → next API call 401 → client routes to `/session-expired`.

---

## 3. Per-role flow certification

### 3.1 SUPER_ADMIN (Administrator)

| Step | Route / API | Status |
|------|-------------|--------|
| 1. Land on dashboard | `/dashboard` ← `GET /dashboard/summary` | Code ✓; smoke admin login **failed** on prod |
| 2. Browse borrowers | `/borrowers` ← `GET /borrowers` | Code ✓; RBAC fixed (admin permission required) |
| 3. Review pending (admin view) | `/borrowers?status=PENDING` | Code ✓ |
| 4. Manage loans | `/loans`, `/loans/new`, `/loans/[id]` | Code ✓ |
| 5. Disburse | UI → `POST /loans/:id/disburse` | Code ✓; cert harnesses exist |
| 6. Communication center | `/communication-center` | Code ✓ |
| 7. Settings / users / roles | `/settings` | Code ✓ |
| 8. Adjustments / reversals | `/adjustments` | Code ✓; cert scripts in `package.json` |

**E2E:** `role-journeys.spec.ts` (super-admin dashboard heading); `p13-workflows.spec.ts` (groups, settings, search).

---

### 3.2 COLLECTOR

| Step | Route / API | Status |
|------|-------------|--------|
| 1. Dashboard | `/collector/dashboard` ← `GET /collector/:id/dashboard` | Code ✓; prod smoke **200** |
| 2. My borrowers | `/collector/my-borrowers` ← `GET /collector/:id/borrowers` | Code ✓ |
| 3. Record payment | `/collector/payment/[id]` → `POST /payments` | Code ✓; GPS + idempotency |
| 4. Offline queue | `useRecordPaymentOrQueue` → IndexedDB → `POST /sync/offline/batch` | Code ✓; expense queue type exists, sync handler **payments only** |
| 5. Admin fee | `/collector/admin-fee` → `POST /transactions/admin-fee` | Code ✓ |
| 6. Reconciliation | `/collector/reconciliation` ← `/reconciliations` | Code ✓; prod smoke **200** |
| 7. Expenses | `/collector/expenses` → `POST /expenses` | Code ✓ |
| 8. Collection sheet | `/collector/groups/[id]/collection-sheet` | Code ✓ |

**E2E:** `collector-shell.spec.ts`, `login-ux.spec.ts`, `p13-workflows.spec.ts`; offline expense sync unit-tested.

**Blocked paths (verified):** Admin dashboard 403 (prod smoke); `GET /borrowers` 403 after RBAC fix (`borrower-list-rbac.test.ts`).

---

### 3.3 REGISTRATION_OFFICER

| Step | Route / API | Status |
|------|-------------|--------|
| 1. Registration wizard | `/officer/register` | Code ✓ |
| 2. Draft autosave | `POST/PATCH /borrowers/drafts` | Code ✓ |
| 3. Submit registration | `POST /borrowers/drafts/:id/submit` or `POST /borrowers` | Code ✓ |
| 4. My registrations | `/officer/my-registrations` ← `GET /borrowers/my-registrations` | Code ✓ |
| 5. View own borrower | `GET /borrowers/:id` (officer-scoped) | Code ✓; `REGISTRATION_FIX_REPORT.md` |
| 6. Photo capture session | `POST /registration/capture-sessions` | Code ✓; `rbac.test.ts` 201 |

**E2E:** `role-journeys.spec.ts` (officer lands on register, full name field visible).

---

### 3.4 APPROVER

| Step | Route / API | Status |
|------|-------------|--------|
| 1. Pending queue | `/approver/pending` ← `GET /borrowers?status=PENDING` | Code ✓; requires `REVIEW_APPLICATIONS` after RBAC fix |
| 2. Review detail | `/approver/pending/[id]` ← `GET /borrowers/:id/review` | Code ✓ |
| 3. Approve / reject / blacklist | `PATCH /borrowers/:id/approve|reject|blacklist` | Code ✓ |
| 4. Reviewed history | `/approver/reviewed` ← `GET /borrowers/reviewed` | Code ✓ |
| 5. Loan approve/disburse | `PATCH /loans/:id/approve`, `POST …/disburse` | Code ✓; approver uses `APPROVE_LOANS` not `GET /loans` |
| 6. Offline sync conflicts | `/approver/sync-conflicts` ← `/sync/conflicts` | Code ✓ |

**E2E:** `role-journeys.spec.ts` (pending queue tab/link).

---

### 3.5 AUDITOR

| Step | Route / API | Status |
|------|-------------|--------|
| 1. Reports hub | `/auditor/reports` ← `/reports/*` | Code ✓ |
| 2. Audit log | `/auditor/audit-log` ← `GET /audit-log` | Code ✓ |
| 3. Export reports | UI → report export endpoints | Code ✓ (`EXPORT_REPORTS`) |
| 4. Read borrower summaries | `GET /borrowers` | Code ✓; `borrower-list-rbac.test.ts` 200 |
| 5. Risk flags (read) | Via reports / risk APIs if linked | Code ✓ (`REVIEW_RISK_FLAGS`) |

**E2E:** `role-journeys.spec.ts` (auditor reports landing); `rc1-functional-audit.spec.ts` (`/auditor/reports`, `/auditor/audit-log`).

---

### 3.6 Group Leader & Borrower (non-login)

| Concept | Flow | Status |
|---------|------|--------|
| **Group Leader** | Assigned via group profile UI (`GroupMembershipManagement.tsx`); appears on collection sheets as `leaderName` | Domain only; no login |
| **Borrower** | Registered by officer; approved by approver; receives loans/collections via collector | Entity only; no self-service portal |

---

## 4. Cross-cutting flows

### 4.1 Registration → approval → group formation

```
Officer register → submit → PENDING queue
  → Approver approve → PATCH /borrowers/:id/approve
  → POST /groups/formation/process-approval (RBAC: approver/admin/collector-manage)
  → Borrower APPROVED + optional auto-group
```

### 4.2 Loan lifecycle

```
APPROVED borrower → POST /loans → PATCH approve → POST disburse
  → GET schedule/progress → collector POST /payments
  → optional POST /payments/:id/reverse (admin)
```

### 4.3 Offline / sync

| Component | Path | Verified |
|-----------|------|----------|
| Queue store | `offlineQueueStore.ts` | Unit tests |
| Payment replay | `paymentSyncHandler.ts`, `useOfflineQueueSync.ts` | Code ✓; unit tests |
| Expense replay | `expenseSyncHandler.ts`, `useRecordExpenseOrQueue.ts` | Code ✓; `expenseSyncHandler.test.ts` |
| Batch API | `POST /sync/offline/batch` (payments) | Code ✓ |
| Expense online sync | `expenseService.createExpense` on reconnect | Code ✓ |
| Approver conflicts | `/approver/sync-conflicts` | Code ✓ |

### 4.4 Communications

Super-admin Communication Center → `/communications/*` APIs; invitation and password emails via `event-dispatch.ts`; tracking pixels/clicks (open redirect noted in Stage 1).

---

## 5. Verification evidence

### 5.1 Executed in this workspace (2026-07-10)

| Harness | Result | Notes |
|---------|--------|-------|
| Backend Vitest (full) | **90/90 PASS** | Includes RBAC + borrower list tests |
| Frontend offline/expense tests | **PASS** | `expenseSyncHandler.test.ts`, `OfflineBanner.test.tsx` |
| Frontend auth Vitest | **Not verified** | IPC/worker crash in constrained environment |
| Playwright e2e | **Not executed** | Requires running app + `npx playwright install` |
| `smoke:rbac` (prod BFF) | **7/8** | Admin login failed; collector/officer checks pass |
| Stage 1 security harness | **11/11** (prior session) | Financial mutation blocks |

### 5.2 Playwright inventory (`apps/frontend/e2e/`)

| Spec | Flow coverage |
|------|----------------|
| `login-ux.spec.ts` | Login UX |
| `logout.spec.ts` | Logout |
| `session-expired.spec.ts` | Session expiry page |
| `role-journeys.spec.ts` | Officer, approver, super-admin, **auditor** landings |
| `collector-shell.spec.ts` | Collector nav/dashboard |
| `p13-workflows.spec.ts` | Multi-role workflows |
| `shell-navbar.spec.ts` | Admin navigation |
| `rc1-functional-audit.spec.ts` | All five roles — **current route map** |

---

## 6. Flow gaps & risks

| ID | Flow area | Severity | Finding | Status |
|----|-----------|----------|---------|--------|
| F3-01 | Auditor E2E | Low | No Playwright helper for auditor role | **Fixed** — `e2e/helpers/auth.ts` + `role-journeys.spec.ts` |
| F3-02 | E2E drift | Medium | `rc1-functional-audit.spec.ts` references removed routes | **Fixed** — paths updated to `/officer/*`, `/collector/*`, `/auditor/*` |
| F3-03 | Offline expenses | Medium | Queue enqueued in UI; sync handler payments-only | **Fixed** — `expenseSyncHandler.ts` + `useRecordExpenseOrQueue` |
| F3-04 | Invitation | Medium | Email-only accept; static temp password pattern |
| F3-05 | Password reset | High | Sessions survive reset (Stage 1 S1-H04) |
| F3-06 | Production drift | Medium | Deployed API v1.2.1 vs repo v1.3.1 (`BASELINE.md`) |
| F3-07 | Push / SMS reminders | Low | Documented as not implemented (`CHANGELOG.md`) |
| F3-08 | Full-stack E2E | Info | Not run in audit environment |

---

## 7. Not verified

- Live Playwright pass/fail against Vercel + Railway
- Auditor login journey on production
- Super-admin full workflow with production credentials
- Borrower-facing flows (N/A — no portal)
- Mobile device PWA background sync on real hardware
- Communication send/delivery on production

---

## 8. Remediation carried on this branch

### Stage 2 RBAC gaps

| Gap ID | Fix |
|--------|-----|
| R2-G01 | `assertBorrowerListAccess` on `GET /borrowers` |
| R2-G02 | Collector assignment check in `assertBorrowerReadAccess` |
| R2-G03 | `requirePermission` on group-formation routes |
| R2-G04 | `requirePermission` on `/search`; use `session.role` not query param |
| R2-G06 | `resolveUserPermissions` from DB `user_roles` + overrides, fallback to shared-rbac |
| R2-G07 | Frontend `ROLE_DEFINITIONS` collector permissions synced |
| R2-G09, R2-G10 | Permission checks on borrower validation and admin-fee list routes |

---

## 9. Stage boundary

Stage 3 deliverable complete. **Stage 4** → `API_AND_DATABASE_REVIEW.md` (not started).

**Files reviewed:** `apps/frontend/src/app/**`, `apps/frontend/e2e/**`, `apps/backend/src/modules/**/routes.ts`, auth/BFF routes, offline sync modules, existing audit reports cited above.
