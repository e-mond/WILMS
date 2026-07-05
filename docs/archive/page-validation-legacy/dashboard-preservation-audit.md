# Dashboard Preservation Audit

Recorded: 2026-06-09  
Policy: Product-owner dashboard tweaks must remain intact during P11d.

---

## Protected files (no layout refactoring)

These files were **not** structurally modified during P11d:

| File | Role |
|---|---|
| `src/features/super-admin-dashboard/components/SuperAdminDashboard.tsx` | Super Admin dashboard layout |
| `src/features/super-admin-dashboard/components/DashboardCollectionSummary.tsx` | Collection widget |
| `src/features/super-admin-dashboard/components/DashboardExpenseSummary.tsx` | Expense widget |
| `src/features/super-admin-dashboard/components/DashboardCycleSnapshot.tsx` | Cycle snapshot |
| `src/features/super-admin-dashboard/components/DashboardCollectorPerformance.tsx` | Collector performance |
| `src/features/super-admin-dashboard/components/DashboardAlertsAside.tsx` | Alerts aside |
| `src/features/payment-collection/components/CollectorDashboardPanel.tsx` | Collector dashboard |
| `src/app/(super-admin)/dashboard/page.tsx` | Super Admin route |
| `src/app/(collector)/collector/dashboard/page.tsx` | Collector route |

---

## Syntax-only fixes applied

| File | Change | Reason |
|---|---|---|
| `SuperAdminDashboard.tsx` | Removed unused type import `DashboardQuickActionIconName` | ESLint `@typescript-eslint/no-unused-vars` ÔÇö build gate |

**No changes to:** grid structure, widget order, KPI rows, aside injection, hero layout, chart containers, or component composition.

---

## Components intentionally left untouched

- All dashboard sub-widgets (`Dashboard*Summary`, `GroupRiskCard` compact usage, quick actions row)
- `CollectorDashboardPanel` hero, alerts, today's groups, recent payments
- `useDashboardSummary` / `useCollectorDashboard` hooks
- Dashboard mock factories and builders
- Dashboard test files (not re-run for layout assertions)

---

## Export pass scope boundary

P11d export UI changes were limited to:

- `ManagementToolbar.tsx` (shared list/report toolbar ÔÇö **not** a dashboard component)
- `WilmsExportActions.tsx`
- `ExportCsvButton.tsx`
- `print-engine.ts` (print page number CSS only)

Dashboard pages contain **no export toolbars** and were not affected by container resizing.

---

## Build verification

| Check | Dashboard impact |
|---|---|
| `npm run type-check` | Pass ÔÇö no dashboard type errors |
| `npm run lint` | Pass after unused-import fix only |
| `npm run build` | Pass (43 routes) after clean `.next` rebuild |
| Export tests | Pass ÔÇö no dashboard tests modified |

---

## Sign-off

Manual dashboard tweaks preserved. Only minimum lint fix applied to `SuperAdminDashboard.tsx`. Export container fixes did not alter dashboard layouts.
