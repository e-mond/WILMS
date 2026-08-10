# WILMS Offline Phase 6 — Test Report

**Product version:** 1.8.0  
**Branch:** `feature/v1.8.0-offline-first-pwa`  
**Phase:** 6 — Test evidence  
**Language:** British English  
**Date:** 2026-08-10  

## Scope under test

- Phase 4 flag defaults (`offlineMode` / `isOfflineModeEnabled`)  
- Phase 5 flag-gated SW navigate fallback (code review + unit coverage for flag helper)  
- Existing offline queue / domain flag suites touched by this sprint  

## Automated results

| Check | Command / target | Result |
|-------|------------------|--------|
| Domain feature flags | `vitest run src/tests/platform/feature-flags.test.ts` | **PASS** (4 tests) |
| Frontend offline-mode helper | `vitest run src/tests/config/offline-mode.test.ts` | **PASS** (3 tests) |
| Frontend type-check | `npm run type-check -w @wilms/frontend` | **PASS** (prior session on related work; re-run recommended in CI) |
| Domain type-check | `npm run type-check -w @wilms/domain` | **PASS** (CI / prior) |

## Flag-off parity (contract)

| Expectation | Evidence |
|-------------|----------|
| `offlineMode` defaults false | `feature-flags.test.ts` |
| Client helper defaults false | `offline-mode.test.ts` |
| SW navigate fallback inactive until message enables flag | `public/sw.js` — `offlineModeEnabled` starts `false`; navigations still bypass cache via `shouldBypassCache` when flag off |

## Manual simulation checklist

| Scenario | Status | Notes |
|----------|--------|-------|
| Airplane mode + precached route (flag **off**) | **Not executed in this environment** | Expect network error / browser offline page for navigations (parity) |
| Airplane mode + precached route (flag **on**) | **Not executed** | Expect cached shell HTML after SW received `WILMS_SET_OFFLINE_MODE` |
| Browser close / reopen | **Not executed** | Existing queue persistence still localStorage-based |
| Refresh while offline | **Not executed** | |
| Reconnect drain | **Not executed** | Existing `useOfflineQueueSync` path |
| Stale cache / new deployment | **Not executed** | Existing update prompt |
| Logout / login | **Not executed** | |
| Multiple tabs | **Not executed** | |

These device checks remain required before enabling `WILMS_OFFLINE_MODE=true` in production. Aligns with residual in `docs/v1.8.0/certification/OFFLINE_CERTIFICATION_REPORT.md`.

## Regressions observed

None in automated suites run for Phase 4–5 flag helpers.

## Risks

1. SW in-memory flag resets on worker restart until client re-posts — registrar posts on register/update.  
2. Manual offline matrix still open.  
3. Do not treat Phase 5 as full offline-first.

## Next

Phase 7 — financial offline simulation (desk analysis + decision whether payment queue expansion is safe).
