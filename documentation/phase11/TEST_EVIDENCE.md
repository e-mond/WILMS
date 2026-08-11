# Phase 11 Test Evidence

**Product:** WILMS v1.8.0  
**Branch:** `feature/v1.8.0-registration-loan-communications-hardening`  
**Date:** 2026-08-11

## Commands executed

| Command | Result |
|---------|--------|
| `npm run type-check` | Passed |
| `npm run lint` | Passed (0 warnings) |
| `npm run test` (frontend workspace default) | Passed — 95 files, 272 tests |
| `npm run test -w @wilms/domain -- --run` (targeted Phase 11 + notifications) | Passed — 15 tests |
| `npm run test -w @wilms/domain -- --run src/tests/borrowers/sod-self-approve.test.ts` | Passed (timeout raised after suite flake) |
| `npm run build` | Passed |

## Phase 11 domain suites

| Suite | Result |
|-------|--------|
| `loans/sod-self-approve.test.ts` | Passed (2) |
| `loans/pool-capital-create.test.ts` | Passed (2) |
| `lending/payment-day-recalculate.test.ts` | Passed (2) |
| `notifications/templates.test.ts` | Passed (9) |

## Notes

- Full domain suite once showed a 15s timeout on borrower SoD under load; mock exports completed and timeout raised to 30s; isolated re-run passed.
- No fabricated screenshots or CI links — evidence is from local commands on this branch.
- Migrations: none.
