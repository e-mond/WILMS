# Regression Test Report — v1.3.6-rc1

**Date:** 2026-07-12

---

## Automated regression

| Suite | Result | Count |
|-------|--------|-------|
| `npm run type-check` | PASS | — |
| `npm run lint` | PASS | 0 warnings |
| `npm test -w @wilms/api` | PASS | 108/108 |
| `npm test` (frontend) | PASS | 233/233 |
| `npm run build` | PASS | 55 routes |
| `npm run bundle:budget-check` | PASS | — |

## Workflows touched by fixes

| Workflow | Regression risk | Verification |
|----------|-----------------|--------------|
| Collector settings / app lock | Medium | E2E `app-lock.spec.ts` updated to Settings → App Lock |
| Admin collectors messaging | Medium | Schema test + manual path via `CollectorsManagementPanel` |
| Collector security URL | Low | Redirect to settings — bookmarks still work |
| Health endpoint | Low | `health.service.test.ts` updated |

## E2E status

Full Playwright suite (236 tests) — run in CI on PR merge. Targeted `app-lock.spec.ts` paths updated for settings navigation.

## Regressions found

None in automated unit/integration gates for this RC.
