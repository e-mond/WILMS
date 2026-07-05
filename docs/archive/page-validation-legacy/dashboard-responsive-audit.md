# Dashboard Responsive Audit (Pre-P10)

Audit date: 2026-06-09  
Scope: Super Admin `/dashboard` ÔÇö Collector Performance, Group Risk, Cycle Snapshot, KPI Cards, Borrower Status, Quick Actions, Recent Alerts Aside.

## Breakpoint matrix

| Breakpoint | Width | Layout behaviour |
|---|---|---|
| Mobile | `<640px` | Single column; KPI 1-col; borrower legend 2-col; collector cards; cycle 1-col; aside via drawer |
| Tablet | `640ÔÇô1023px` | KPI 2-col; borrower legend 2ÔÇô3 col; collector cards; group risk donut + 2-col legend |
| Laptop | `1024ÔÇô1279px` | Collector table (`lg+`); KPI 3-col; main grid 2-col for performance/risk |
| Desktop | `1280ÔÇô1535px` | Borrower + Quick Actions side-by-side (`xl`); aside rail visible (`xl+`) |
| Ultra-wide | `ÔëÑ1536px` | KPI 4-col (`2xl`); full executive grid |

## Section findings

### 1. KPI Cards (`ExecutiveKpiGrid`)

| Check | Status | Notes |
|---|---|---|
| Layout stacking | Ô£à | `grid-cols-1 ÔåÆ sm:2 ÔåÆ lg:3 ÔåÆ 2xl:4` |
| Card sizing | Ô£à | Equal grid cells; `KpiCard variant="executive"` |
| Typography | Ô£à | Token-based heading/body |
| Touch targets | N/A | Non-interactive cards |

### 2. Borrower Status

| Check | Status | Notes |
|---|---|---|
| Layout stacking | Ô£à | Bar full-width; legend `sm:2 lg:3 xl:5` |
| Clipping | Ô£à | Percent bar uses flex segments |
| Typography | Ô£à | Counts use `toLocaleString()` from service data |

### 3. Quick Actions

| Check | Status | Notes |
|---|---|---|
| Touch targets | Ô£à | `min-h-[44px]` on each link |
| Layout | Ô£à | Stacks vertically in aside column |
| Horizontal scroll | Ô£à | None |

### 4. Collector Performance

| Check | Status | Notes |
|---|---|---|
| Desktop table | Ô£à | `DataTable variant="executive"` at `lg+` |
| Mobile/tablet cards | Ô£à | `DashboardCollectorPerformance` card list `<lg` |
| All metrics preserved | Ô£à | Expected, Actual, Rate %, Variance + trend colours |
| Table overflow | Ô£à | Cards avoid compressed table on narrow viewports |

**Implementation:** `src/features/super-admin-dashboard/components/DashboardCollectorPerformance.tsx`

### 5. Group Risk Distribution

| Check | Status | Notes |
|---|---|---|
| Donut readability | Ô£à | Responsive `h/w` 28ÔåÆ32ÔåÆ36; inner label scales |
| Legend overflow | Ô£à | `truncate` labels; `sm:grid-cols-2 md:grid-cols-1` |
| Label overlap | Ô£à | Percent values `shrink-0` |
| Chart scaling | Ô£à | Conic gradient unchanged; centre total from service |

**Implementation:** `src/components/data-display/GroupRiskCard.tsx`

### 6. Cycle Snapshot

| Check | Status | Notes |
|---|---|---|
| Intelligent wrap | Ô£à | `grid-cols-1 sm:grid-cols-2` |
| Equal card heights | Ô£à | `min-h-[72px] flex-col justify-center` |
| Clipping | Ô£à | Bordered cells with padding |
| Spacing | Ô£à | Consistent `gap-wilms-3` |

**Implementation:** `src/features/super-admin-dashboard/components/DashboardCycleSnapshot.tsx`

### 7. Recent Alerts Aside

| Check | Status | Notes |
|---|---|---|
| Desktop rail | Ô£à | `AppAside` at `xl+` via shell |
| Mobile drawer | Ô£à | `ShellAsideDrawer` + `useShellAsideContent` |
| Tablet drawer | Ô£à | Same `<xl` drawer pattern |
| Dark/light theme | Ô£à | Semantic tokens (`danger`, `text-primary`, `border`) |
| Touch targets | Ô£à | Alert links `min-h-[44px]` |
| Pagination | N/A | Scroll list in aside |

**Implementation:** `DashboardAlertsAside.tsx` touch polish; shell drawer unchanged.

## Drawer behaviour

- **Navigation drawer:** Office mobile bar ÔåÆ `Drawer` with full `AppSidebar` (unchanged).
- **Aside drawer:** Dashboard alerts injected via `AsideSlotProvider`; opens from shell controls below `xl`.

## Files changed

- `SuperAdminDashboard.tsx` ÔÇö uses extracted responsive components
- `DashboardCollectorPerformance.tsx` ÔÇö new
- `DashboardCycleSnapshot.tsx` ÔÇö new
- `GroupRiskCard.tsx` ÔÇö responsive donut + legend
- `ExecutiveKpiGrid.tsx` ÔÇö lg/2xl breakpoints
- `DashboardAlertsAside.tsx` ÔÇö touch-friendly alert rows

## Validation commands

```bash
npm run lint
npm run type-check
npm test -- src/tests/super-admin-dashboard
npx playwright test e2e/shell-navbar.spec.ts --project=mobile
```
