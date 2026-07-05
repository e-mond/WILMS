# WILMS — Test Status Report

**Audit date:** 2026-07-04 · **Commit:** `487708b`

---

## Latest verified results

| Suite | Command | Result | Date |
|-------|---------|--------|------|
| Type-check | `npm run type-check` | **PASS** | 2026-07-04 (requires `next build` first for `.next/types`) |
| Lint | `npm run lint` | **PASS** — 0 ESLint warnings | 2026-07-04 |
| Frontend build | `npm run build -w @wilms/frontend` | **PASS** | 2026-07-04 |
| Backend unit tests | `npm run test -w @wilms/api` | **52/52 PASS** (14 files) | 2026-07-04 |
| Frontend unit tests | `npm run test -w @wilms/frontend` | **217/220 PASS** (3 FAIL) | 2026-07-04 |
| Production smoke | `npm run smoke:production` | **31/32 PASS** | 2026-07-04 |
| RBAC smoke | `npm run smoke:rbac` | **11/11 PASS** | 2026-07-04 |
| Deploy sync | `npm run verify:deploy-sync` | **PASS** | 2026-07-04 |
| Empty DB handlers | `npm run verify:empty-db` | **10/10 PASS** | 2026-07-04 |
| E2E Playwright | `npm run test:e2e` | **NOT RUN** this audit | — |
| Coverage report | `npm run test:coverage` | **NOT RUN** this audit | — |

---

## Frontend test failures (blocking v1.0)

| File | Test | Cause |
|------|------|-------|
| `Toast.test.tsx` | dismiss button click | Accessible name changed — expects `/Dismiss Sync…/` pattern; button now labeled "Dismiss" only |
| `Modal.test.tsx` | close button | Close button no longer has `aria-label="Close dialog"` |
| `PasswordField.test.tsx` | visibility toggle | Button text changed to "Show password" / "Hide password" |

These regressions correlate with commit `487708b` accessibility pass. **Fix required before v1.0 tag.**

---

## Backend test coverage

| Area | Tests |
|------|-------|
| Loan pools service | 1 |
| Reconciliation service + domain + repository | 9 |
| Health service | 3 |
| Risk flags service | 4 |
| Borrower risk / guarantor eligibility | 7 |
| Reports domain | 4 |
| Notifications templates | 6 |
| Collector portal access + RBAC HTTP | 10 |
| Empty database list handlers | 7 |
| Sync constants | 1 |

**Gap:** ~140 API routes without HTTP-level tests.

---

## Frontend test inventory

| Category | Count |
|----------|-------|
| Vitest files | 80 files (161 tests in shard 1 reporting; 220 total) |
| Playwright E2E | 15 specs |
| Skipped tests | 1 conditional — `shell-navbar.spec.ts` mobile skip |
| Flaky tests | **Not characterized** — Windows full suite ~6 min |

Report panels **without** dedicated component tests: Defaulter, Collector Performance, Group Risk, Financial Ledger.

---

## Smoke test detail

### Production smoke failure

| Check | Status | Detail |
|-------|--------|--------|
| `api-health-gitCommit-expected` | **FAIL** | `.env` has stale `EXPECTED_GIT_COMMIT=e8b4ede…`; live is `487708b` |

All other 31 checks passed including CSRF, login, BFF proxies, Brotli encoding, no demo banner on login page.

### RBAC smoke (all pass)

Admin → dashboard, settings/users, collectors (200)  
Collector → own dashboard (200), blocked admin routes (403), reconciliation (200)  
Officer → blocked dashboard (403)

---

## CI status

GitHub Actions / CI pipeline: **Not verified** this audit (`gh` not authenticated).

---

## Recommendations

1. Update failing Toast/Modal/PasswordField tests to match a11y-visible-text pattern  
2. Set `EXPECTED_GIT_COMMIT=$(git rev-parse HEAD)` in CI and local `.env` for 32/32 smoke  
3. Add HTTP integration tests for top BFF paths  
4. Run Playwright E2E on staging before v1.0  
5. Generate coverage baseline and set minimum thresholds in CI
