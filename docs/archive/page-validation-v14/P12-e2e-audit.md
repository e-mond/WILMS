# P12 E2E Audit

Audit date: 2026-06-09. Playwright specs: `e2e/*.spec.ts` (13 files). Helpers: `e2e/helpers/auth.ts`.

---

## Coverage map

| Workflow | Status | Spec file(s) | Notes |
|----------|--------|--------------|-------|
| **Login** | **Covered** | `login-ux.spec.ts`, `auth-and-theme.spec.ts` | Password toggle, remember email, successful sign-in |
| **Logout** | **Covered** | `logout.spec.ts` | Collector + super admin; session cleared; protected route redirect |
| **Registration** | **Partially covered** | `role-journeys.spec.ts` | Officer lands on register page; form field visible; **no full wizard submit** |
| **Approval** | **Partially covered** | `role-journeys.spec.ts` | Approver lands on pending queue; **no approve/reject flow** |
| **Group assignment** | **Missing** | — | No spec for group profile, membership, or formation |
| **Collection workflow** | **Partially covered** | `collector-shell.spec.ts` | Dashboard + bottom nav only; **no payment recording** |
| **Expenses** | **Missing** | — | No expense form or submission spec |
| **Reports** | **Missing** | — | No report hub or export spec |
| **User management** | **Missing** | — | No settings users invite/edit spec |
| **Search** | **Missing** | — | No global search spec |
| **App lock** | **Covered** | `app-lock.spec.ts` | PIN setup, idle lock, unlock |

---

## Additional specs (supporting, not in required list)

| Spec | Focus |
|------|-------|
| `session-expired.spec.ts` | Expired session redirect |
| `splash-bootstrap.spec.ts` | Splash / bootstrap |
| `shell-navbar.spec.ts` | Shell navbar behaviour |
| `responsive-breakpoints.spec.ts` | Layout breakpoints |
| `accessibility.spec.ts` | axe WCAG audit on key pages |
| `pwa.spec.ts` | Manifest / install metadata |
| `toast-feedback.spec.ts` | Toast UI |

---

## Stale / drift risks

| Issue | Evidence |
|-------|----------|
| Mobile drawer for officer/approver | `role-journeys.spec.ts` lines 10–28 expect `Open navigation menu` drawer — **P11i moved operational roles to bottom nav**; test may fail on mobile |
| Super admin mobile logout | `logout.spec.ts` opens drawer on mobile — super admin still uses drawer (valid) |

---

## Summary counts

| Category | Count |
|----------|-------|
| Covered (required workflows) | 3 (login, logout, app lock) |
| Partially covered | 4 (registration, approval, collection, implicit auth in other specs) |
| Missing | 5 (group assignment, expenses, reports, user management, search) |

Total spec files: **13**. Required-workflow dedicated coverage: **~27% full**, **~36% partial**, **~45% missing**.
