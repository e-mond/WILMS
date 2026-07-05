# Dependency Cleanup Report

**Date:** 2026-07-05  
**Branch:** `hotfix/v1.1.1-production-fixes`

## Actions

- Reviewed workspace `package.json` files (root, frontend, backend, packages).
- No packages removed in this pass — all declared dependencies are referenced by build, test, or runtime code.
- No breaking `npm audit fix` applied (reverted in v1.0.1 due to Vitest/Vite type regression).

## Workspace packages (retained)

| Package | Role |
|---------|------|
| `@wilms/frontend` | Next.js UI |
| `@wilms/api` | Express backend |
| `@wilms/shared-utils` | Display IDs, currency |
| `@wilms/shared-validation` | Zod schemas |
| `@wilms/shared-rbac` | Permissions |
| `@wilms/shared-contracts` | DTO contracts |

## Dev dependencies

| Package | Role |
|---------|------|
| `vitest` (root) | Frontend test runner |
| Per-app devDeps | TypeScript, ESLint, Playwright, Drizzle, etc. |

## Remaining advisories (deferred to v1.2+)

| Chain | Severity | Notes |
|-------|----------|-------|
| `next` / PostCSS | High / Moderate | Major upgrade needs full E2E + smoke |
| `drizzle-orm` | High | Breaking minor; migration validation required |
| `@playwright/test` | High | Browser install validation |
| `exceljs` / `uuid` | Moderate | Export regression testing |
| `dompurify` | Moderate | Bundled with prior reverted lockfile churn |

## Recommendation

Schedule a dedicated **dependency hardening** task in v1.2 with full CI, migration, E2E, and production smoke validation. Do not upgrade during hotfix cleanup.

## Verification

`npm run type-check`, `npm run build`, and full test suites pass on current lockfile.
