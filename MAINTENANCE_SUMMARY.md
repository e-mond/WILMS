# Maintenance Summary

**Branch:** `release/v1.0.1-maintenance`  
**Release target:** v1.0.1  
**Mode:** Maintenance only  
**Date:** 2026-07-05

## Completed

- Archived 11 root RC1/v1.0.0 readiness reports to `docs/archive/v1.0.0-rc1.4/`.
- Archived historical phase validation corpus from `docs/page-validation/` to `docs/archive/page-validation/`.
- Removed one proven-unused component (`AppLockRequiredGate`).
- Redirected generated verification outputs to `docs/generated/` (gitignored).
- Refreshed authoritative docs for v1.0.1 maintenance (`README`, `PROJECT_STATUS`, deployment/security guides).
- Documented remaining dependency and technical-debt risks without forcing breaking upgrades.

## Not changed

- No business features added.
- No production migrations removed.
- No production verification scripts removed.
- Mock/demo infrastructure retained where required by tests, local development, or reference seeding.

## Verification (2026-07-05)

| Check | Result |
|-------|--------|
| `npm ci` | PASS |
| `npm run type-check` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run test -w @wilms/api` | PASS (53/53) |
| `npm run test -w @wilms/frontend` | PASS (438/438 across 2 shards) |
| `npm run verify:api-integrity` | PASS |
| `npm run verify:api-coverage` | PASS |
| `npm run verify:mock-guard` | PASS |

## Dependency note

A non-breaking `npm audit fix` was attempted and **reverted** (`c942a78`) because it introduced a Vitest/Vite duplicate type-tree regression in frontend type-check. Lockfile remains at the pre-audit baseline; breaking upgrades are deferred to a dedicated hardening PR.

## PR

Open a PR from `release/v1.0.1-maintenance` into `main`. Do not merge directly.
