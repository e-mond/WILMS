# FINAL_ARCHITECTURE_REVIEW.md

**Version:** 1.3.8 · **Date:** 2026-07-17

## Shape

npm workspaces + Turborepo-style scripts:

- `apps/frontend` — Next.js 14, BFF `/api/wilms`
- `apps/backend` — Express API, Drizzle
- `packages/shared-*` — contracts, rbac, types, validation, utils

## Cohesion / Coupling Assessment

| Area | Assessment |
|---|---|
| RBAC | Strong shared matrix + server `requirePermission` |
| Settings / roles | Service + routes aligned; overrides added in 1.3.8 |
| Financial modules | Clear separation; cert harnesses exist |
| Messaging | Thread access bound to session participants |
| Frontend services | Interface + mock/prod swap via webpack alias |
| Shell/layout | Live path is DashboardShell / AppNavbar (dead OfficeShellHeader removed) |

## Simplifications Applied

- Removed unused UI surface area from barrels
- Single SMS phone normalizer for notifications
- Consistent error-boundary presentation helper

## Do Not Restructure (freeze)

BorrowerRegistrationWizard, SettingsSectionViews, CollectorsManagementPanel — large but live; rewriting risks regressions without feature need.

## Verdict

Architecture is **internally consistent** for long-term maintenance. Remaining coupling is intentional domain complexity, not accidental duplication.
