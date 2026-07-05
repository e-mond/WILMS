# RC1 Mock Removal ÔÇö Phase 2

**Date:** 2026-07-01  
**Verdict:** Production paths decoupled; mock layer isolated to dev/test

## Production fixes

| Item | Action |
|------|--------|
| Placeholder toasts (groups, pools, collectors, messaging) | Replaced with live modals + API |
| `useRiskFlagActions` audit-only | Wired to `riskFlagService` mutations |
| `daily-collection-report.ts` DEMO_ACCOUNTS | Removed; uses API row data |
| Settings Force logout / MFA buttons | Removed (no backend); documented in roadmap |
| `SettingsUserProfileModal` "coming soon" titles | Removed |

## Isolated mock layer (KEEP)

| Path | Purpose |
|------|---------|
| `apps/frontend/src/services/mock/` | Dev/demo webpack alias only |
| `apps/frontend/src/mocks/` | Static seed data for mock services |

Production build uses `index.production.ts` ÔåÆ `ApiDataProvider` (webpack alias).

## Utils still mock-coupled (mock services only)

These files import mock stores but are **only** referenced from `services/mock/*`:

- `utils/defaulter-report.ts`
- `utils/collector-payment-inputs.ts`
- `utils/collector-performance-report.ts`
- `utils/group-profile.ts`
- `utils/collector-management-list.ts` (partial ÔÇö uses DEMO_ACCOUNTS for mock builders)

No production service imports these utils directly.

## Scan command

```bash
rg -i "not yet available|coming soon" apps/frontend/src --glob '!**/mock/**' --glob '!**/tests/**'
# Expected: 0 matches
```

## Verdict

**PASS** ÔÇö No user-facing production code depends on mock data handlers.
