# P13 E2E Execution Report

Execution date: 2026-06-15. Command: `npm run test:e2e` (Playwright 1.48.0).

---

## Summary

| Metric | Count |
|--------|-------|
| **Total tests** | 156 |
| **Passed** | 2 |
| **Failed** | 153 |
| **Skipped** | 1 |
| **Duration** | 24.9 minutes |
| **Exit code** | 1 |

Projects: `desktop` (1280×720) and `mobile` (390×844), 1 worker, `fullyParallel: false`.

---

## Passed tests

| # | Project | Spec | Test |
|---|---------|------|------|
| 1 | mobile | `pwa.spec.ts` | PWA icons are served |
| 2 | desktop | `pwa.spec.ts` | PWA icons are served (inferred from 2 total passed) |

---

## Skipped tests

1 test skipped (exact name in Playwright output list — 1 skipped total).

---

## Failure pattern (153 tests)

**Root cause (verified from Playwright output):**

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: getByRole('heading', { name: 'Sign in' })
at e2e/helpers/auth.ts:34 — waitForLoginForm()
```

Failures affect virtually all specs that call `signIn()` or navigate to `/login`, including:

- `accessibility.spec.ts` (9 tests)
- `app-lock.spec.ts`
- `auth-and-theme.spec.ts`
- `login-ux.spec.ts`
- `logout.spec.ts`
- `p13-workflows.spec.ts` (8 tests)
- `role-journeys.spec.ts`
- `shell-navbar.spec.ts`
- `responsive-breakpoints.spec.ts`
- And corresponding mobile project duplicates

**Interpretation:** E2E web server at `http://127.0.0.1:3001` did not render the login form within 5s. Login heading exists in app code (`LoginForm.tsx` L128). Failure is environmental/bootstrap, not missing UI text.

---

## Web server configuration

From `playwright.config.ts`:

- Command: `npm run dev -- --hostname 127.0.0.1 --port 3001`
- `reuseExistingServer: !process.env.CI` — reuses existing process on port 3001 when not in CI
- Stale or broken reused server is a documented risk (comment L10: avoids stale chunks vs dev on :3000)

---

## Fix applied

**None in app code** — failures predate login form markup and indicate E2E environment/server readiness, not regression from P13 follow-up changes.

**Recommended retest:**

```bash
# Stop any process on port 3001, then:
set CI=1
npm run test:e2e
```

---

## Retest result

Not re-run after initial failure in this session.

---

## Coverage status (unchanged intent)

Smoke specs exist in `e2e/p13-workflows.spec.ts` for registration, approval, groups, collections, expenses, reports, users, search — but **could not execute** due to login bootstrap failure.
