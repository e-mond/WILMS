# P13 E2E Coverage Expansion Report

Audit date: 2026-06-09. Framework: Playwright (`@playwright/test` 1.48.0). Command: `npm run test:e2e` → `playwright test`.

**Execution note:** P13 E2E tests were added but **not executed** in the P13 validation session. Unit/integration validation: `npm run test` — 400 passed; `npm run build` — success.

---

## P12 baseline

Documented in `context/page-validation/P12-e2e-audit.md`:

- Login, logout, app lock covered
- Registration, approval, collections, expenses, reports, user management, search — missing or partial

---

## P13 additions

New file: `e2e/p13-workflows.spec.ts` — 8 smoke tests:

| Test | Role | Workflow verified |
|------|------|-------------------|
| Registration officer can open registration wizard | Officer | Lands on register page; Full name field + Continue visible |
| Approver can open pending application review | Approver | Pending Queue link visible |
| Super admin can open groups directory and group profile | Super Admin | `/groups` heading; navigates to group profile |
| Collector can open payment entry from dashboard | Collector | `/collector/my-borrowers` heading |
| Collector can open expense form | Collector | `/collector/expenses`; Category field visible |
| Super admin can open reports hub | Super Admin | `/reports` heading |
| Super admin can open user management settings | Super Admin | Settings → Users section |
| Super admin can open global search | Super Admin | Search dialog; query returns Group results |

Helper: `e2e/helpers/auth.ts` — `signIn(page, DEMO_USERS.*)`.

Fix (P13): `e2e/role-journeys.spec.ts` — mobile nav expects bottom `navigation` landmark (P11i layout change).

---

## Full E2E inventory (all spec files)

| File | Test count | Primary coverage |
|------|------------|------------------|
| `p13-workflows.spec.ts` | 8 | P13 workflow smoke (new) |
| `role-journeys.spec.ts` | 3 | Portal landing paths |
| `shell-navbar.spec.ts` | 22 | Navbar, search, notifications, responsive aside |
| `login-ux.spec.ts` | 4 | Login UX, remember email |
| `logout.spec.ts` | 2 | Session clearing |
| `app-lock.spec.ts` | 1 | PIN lock/unlock |
| `auth-and-theme.spec.ts` | 2 | Theme tokens, mobile nav |
| `session-expired.spec.ts` | 2 | Re-login flow |
| `accessibility.spec.ts` | 8 | axe scans |
| `responsive-breakpoints.spec.ts` | (layout) | Breakpoint behavior |
| `collector-shell.spec.ts` | 1 | Collector mobile shell |
| `pwa.spec.ts` | 3 | Manifest, service worker |
| `splash-bootstrap.spec.ts` | 1 | Client bootstrap |
| `toast-feedback.spec.ts` | 1 | Toast UI |

Approximate total: **58+** test cases across 14 spec files (grep `test(` in `e2e/`).

---

## Coverage matrix (P13 task areas)

| Workflow | Covered? | Depth | Evidence |
|----------|----------|-------|----------|
| Login | Yes | Full | `login-ux.spec.ts`, `auth-and-theme.spec.ts` |
| Logout | Yes | Full | `logout.spec.ts` |
| App lock | Yes | Full | `app-lock.spec.ts` |
| Registration | **Partial** | Page load only | `p13-workflows.spec.ts` L5–10 — no form submit |
| Approval | **Partial** | Queue link only | `p13-workflows.spec.ts` L12–16 — no review actions |
| Group creation | **Partial** | View group profile | `p13-workflows.spec.ts` L18–24 — no create-group mutation |
| Collections | **Partial** | My borrowers page | `p13-workflows.spec.ts` L26–31 — no payment recording |
| Expenses | **Partial** | Form visible | `p13-workflows.spec.ts` L33–38 — no submit |
| Reports | **Partial** | Hub heading | `p13-workflows.spec.ts` L40–44 — no export/print |
| User management | **Partial** | Users section visible | `p13-workflows.spec.ts` L46–52 — no CRUD |
| Search | **Partial** | Dialog + results | `p13-workflows.spec.ts` L54–60; also `shell-navbar.spec.ts` |

---

## Remaining gaps

1. **Mutation workflows** — no E2E tests submit registration, approve/reject, record payment, create expense, or create user.
2. **RBAC denial** — no tests verify gated buttons hidden for under-privileged roles.
3. **Upload flows** — no E2E for PhotoUpload / IUploadService.
4. **Export/print** — no E2E for Wilms export actions.
5. **Adjustments, loan creation, risk flag resolution** — not covered.
6. **Playwright CI run** — not verified in P13 session.

---

## Known blockers

| Blocker | Impact |
|---------|--------|
| Demo auth is client-side mock | Mutation tests may pass without validating real API contracts |
| No test database / API server in E2E | Full backend integration tests require running API |
| File upload in Playwright | Registration photo upload E2E needs file fixture + mock upload endpoint |
| Multi-step wizards | Registration/loan wizards need long sequential flows |

---

## Summary

P13 expanded E2E from portal/navigation coverage to **workflow smoke tests** for all eight previously missing areas. All new tests verify **page access and key UI presence only** — not end-to-end business transactions.
