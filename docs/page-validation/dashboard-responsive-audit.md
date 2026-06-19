# Dashboard Responsive Audit (Pre-P10)

Audit date: 2026-06-09  
Scope: Super Admin `/dashboard` — Collector Performance, Group Risk, Cycle Snapshot, KPI Cards, Borrower Status, Quick Actions, Recent Alerts Aside.

## Breakpoint matrix

| Breakpoint | Width | Layout behaviour |
|---|---|---|
| Mobile | `<640px` | Single column; KPI 1-col; borrower legend 2-col; collector cards; cycle 1-col; aside via drawer |
| Tablet | `640–1023px` | KPI 2-col; borrower legend 2–3 col; collector cards; group risk donut + 2-col legend |
| Laptop | `1024–1279px` | Collector table (`lg+`); KPI 3-col; main grid 2-col for performance/risk |
| Desktop | `1280–1535px` | Borrower + Quick Actions side-by-side (`xl`); aside rail visible (`xl+`) |
| Ultra-wide | `≥1536px` | KPI 4-col (`2xl`); full executive grid |

## Section findings

### 1. KPI Cards (`ExecutiveKpiGrid`)

| Check | Status | Notes |
|---|---|---|
| Layout stacking | ✅ | `grid-cols-1 → sm:2 → lg:3 → 2xl:4` |
| Card sizing | ✅ | Equal grid cells; `KpiCard variant="executive"` |
| Typography | ✅ | Token-based heading/body |
| Touch targets | N/A | Non-interactive cards |

### 2. Borrower Status

| Check | Status | Notes |
|---|---|---|
| Layout stacking | ✅ | Bar full-width; legend `sm:2 lg:3 xl:5` |
| Clipping | ✅ | Percent bar uses flex segments |
| Typography | ✅ | Counts use `toLocaleString()` from service data |

### 3. Quick Actions

| Check | Status | Notes |
|---|---|---|
| Touch targets | ✅ | `min-h-[44px]` on each link |
| Layout | ✅ | Stacks vertically in aside column |
| Horizontal scroll | ✅ | None |

### 4. Collector Performance

| Check | Status | Notes |
|---|---|---|
| Desktop table | ✅ | `DataTable variant="executive"` at `lg+` |
| Mobile/tablet cards | ✅ | `DashboardCollectorPerformance` card list `<lg` |
| All metrics preserved | ✅ | Expected, Actual, Rate %, Variance + trend colours |
| Table overflow | ✅ | Cards avoid compressed table on narrow viewports |

**Implementation:** `src/features/super-admin-dashboard/components/DashboardCollectorPerformance.tsx`

### 5. Group Risk Distribution

| Check | Status | Notes |
|---|---|---|
| Donut readability | ✅ | Responsive `h/w` 28→32→36; inner label scales |
| Legend overflow | ✅ | `truncate` labels; `sm:grid-cols-2 md:grid-cols-1` |
| Label overlap | ✅ | Percent values `shrink-0` |
| Chart scaling | ✅ | Conic gradient unchanged; centre total from service |

**Implementation:** `src/components/data-display/GroupRiskCard.tsx`

### 6. Cycle Snapshot

| Check | Status | Notes |
|---|---|---|
| Intelligent wrap | ✅ | `grid-cols-1 sm:grid-cols-2` |
| Equal card heights | ✅ | `min-h-[72px] flex-col justify-center` |
| Clipping | ✅ | Bordered cells with padding |
| Spacing | ✅ | Consistent `gap-wilms-3` |

**Implementation:** `src/features/super-admin-dashboard/components/DashboardCycleSnapshot.tsx`

### 7. Recent Alerts Aside

| Check | Status | Notes |
|---|---|---|
| Desktop rail | ✅ | `AppAside` at `xl+` via shell |
| Mobile drawer | ✅ | `ShellAsideDrawer` + `useShellAsideContent` |
| Tablet drawer | ✅ | Same `<xl` drawer pattern |
| Dark/light theme | ✅ | Semantic tokens (`danger`, `text-primary`, `border`) |
| Touch targets | ✅ | Alert links `min-h-[44px]` |
| Pagination | N/A | Scroll list in aside |

**Implementation:** `DashboardAlertsAside.tsx` touch polish; shell drawer unchanged.

## Drawer behaviour

- **Navigation drawer:** Office mobile bar → `Drawer` with full `AppSidebar` (unchanged).
- **Aside drawer:** Dashboard alerts injected via `AsideSlotProvider`; opens from shell controls below `xl`.

## Files changed

- `SuperAdminDashboard.tsx` — uses extracted responsive components
- `DashboardCollectorPerformance.tsx` — new
- `DashboardCycleSnapshot.tsx` — new
- `GroupRiskCard.tsx` — responsive donut + legend
- `ExecutiveKpiGrid.tsx` — lg/2xl breakpoints
- `DashboardAlertsAside.tsx` — touch-friendly alert rows

## Validation commands

```bash
npm run lint
npm run type-check
npm test -- src/tests/super-admin-dashboard
npx playwright test e2e/shell-navbar.spec.ts --project=mobile
```
