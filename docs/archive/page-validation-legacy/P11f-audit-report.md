# P11f ÔÇö Responsive Completion, Theme Stability, Gap Audit & Backend Readiness

**Verified:** 2026-06-13 against actual codebase (not prior docs).

## Validation

| Check | Result |
|-------|--------|
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass (42 routes) |
| `npm test` | Pass after `shells.test.tsx` PermissionProvider wrap (187 + shard 2) |

---

## P11f-A ÔÇö Global Responsive Audit

### Method

Static code audit of shell, navbar, tables, filters, modals, drawers, export/print controls across all five role shells. No dashboard hierarchy or widget order changed.

### Verified patterns (all roles)

| Area | Evidence | Status |
|------|----------|--------|
| Horizontal overflow | `min-w-0` on main/shell columns (`DashboardShell.tsx`, `ManagementToolbar.tsx`) | OK |
| Filter pills | `FilterPillBar.tsx` horizontal scroll strip | OK |
| Dual filters (registration) | `MyRegistrationsList.tsx` scroll wrapper | OK |
| Data tables | `DataTable.tsx` `overflow-x-auto` | OK |
| Export controls | `WilmsExportActions.tsx` mobile scroll strip | OK |
| Modals | `Modal.tsx` `max-h-[90vh] max-w-lg` | OK |
| Mobile nav drawer | `Drawer.tsx` `max-w-[85vw]` executive variant | OK |
| Aside drawer | `ShellAsideDrawer.tsx` responsive width | OK |
| KPI rows | Service-driven; no layout changes in P11f | OK |
| Ultrawide | Content uses fluid grids + `min-w-0`; no fixed-width overflow found | OK |

### Fixes applied (P11f)

- Navbar action cluster: 44px touch targets on notifications, theme toggle, app lock, settings, profile (`NotificationInboxPanel.tsx`, `ThemeToggle.tsx`, `AppLockNavbarButton.tsx`, `ShellNavbarActions.tsx`, `UserProfileMenu.tsx`).
- Mobile connection chip: compact `On`/`Off` label below `sm`, full `Online`/`Offline` at `sm+` (`ConnectionStatusChip.tsx`).
- Mobile nav drawer: fixed `DashboardShell.tsx` effect that closed drawer immediately when opened (removed `isMobileNavOpen` from effect deps).

### Not changed (per rules)

- `SuperAdminDashboard.tsx` layout/widget order
- `CollectorDashboardPanel.tsx` layout/widget order

---

## P11f-B ÔÇö App Navbar Responsiveness

### Desktop (`AppNavbar.tsx`, `md+`)

- Breadcrumbs left: `PageBreadcrumbs` in grid col 1
- Search centered: `GlobalSearchTrigger variant="desktop"` in grid col 2
- Actions right: `ShellNavbarActions hideSearch` in grid col 3

### Tablet

- Same grid; search remains in center column at `md:block`
- Actions use `gap-1.5 sm:gap-2` with `shrink-0` on icon buttons

### Mobile (`OfficeShellMobileBar.tsx`, `<md`)

| Control | Visible | Touch target |
|---------|---------|--------------|
| Search icon | `GlobalSearchTrigger` compact | 44px |
| Notifications | `NotificationInboxTrigger` | 44px (fixed P11f) |
| Settings | Link + Button | 44px |
| Profile | `UserProfileMenu` avatar always visible | 44px min |
| Lock | `AppLockNavbarButton` Lock icon | 44px |
| Online/Offline | `ConnectionStatusChip compact` | 44px min, label via aria + short text |

Long names truncate via `truncate` on profile text at `sm+`.

---

## P11f-C ÔÇö Sidebar Theme Fix

### Root cause (verified)

Executive sidebar must stay dark while content follows light/dark theme. Light-mode `:root` tokens previously leaked into sidebar nav text/background.

### Fixes in place

1. **`src/styles/tokens.css`** ÔÇö `[data-sidebar='executive']` forces dark palette regardless of content theme; `color-scheme: dark`.
2. **`DashboardShell.tsx`** ÔÇö Desktop aside uses `data-sidebar="executive"` + `bg-executive-sidebar`.
3. **`Drawer.tsx`** ÔÇö `sidebarVariant="executive"` sets dark panel + `data-sidebar="executive"`; `hideHeader` removes light header wrapper on mobile nav drawer.
4. **`AppSidebar.tsx`** ÔÇö Inherits `bg-inherit` inside executive context.

### Runtime expectation

- Expanded/collapsed desktop sidebar: always `#161616` background, light text.
- Mobile drawer: dark panel, no light header bar when executive.
- Content area: respects `ThemeToggle` / `themeStore`.

---

## P11f-D ÔÇö Final Hardcode Audit

### Scan scope

`src/features/**`, `src/components/**` for KPI counts, percentages, trends, charts, analytics literals and direct `@/services/mock` imports.

### Direct mock imports in UI

| Location | Status |
|----------|--------|
| `src/features/**` | **None** (grep verified) |
| `src/components/**` | **None** |

### Violations fixed in P11f

| File | Issue | Fix |
|------|-------|-----|
| `CollectorProfilePanel.tsx` | Hardcoded sidebar lists / group table | Service data via `assembleCollectorProfileDetail()` |
| `PendingApplicationReview.tsx` | Direct mock imports | `groupService`, `collectorManagementService`, `borrowerService` via hooks |
| `collector-profile.builder.ts` (new) | N/A | Builds profile activity from factories + transaction log |

### Acceptable non-KPI literals (not violations)

| File | Content | Reason |
|------|---------|--------|
| `CollectorsManagementPanel.tsx` | Filter thresholds `ÔëÑ90%`, `70ÔÇô89%` | UI filter band labels, not displayed metrics |
| `CollectorsAsidePanel.tsx` | Legend text for rate bands | Static UX copy |
| `SettingsPanel.tsx` / `RoleSettingsPanel.tsx` | `<option value="12">` etc. | Config form labels |
| `SuperAdminDashboard.tsx` | `QUICK_ACTIONS` hrefs | Navigation config only |
| `print-engine.ts` | CSS dimensions | Print layout, not dashboard KPIs |

### Remaining violations

**None** in feature/component UI layers for KPI metrics or direct mock imports.

---

## P11f-E ÔÇö Final Incomplete Work Audit

Status key: **FC** Fully Complete ┬À **PC** Partially Complete ┬À **NS** Not Started ┬À **BL** Blocked ┬À **RB** Requires Backend

| Area | Status | Evidence | Remaining work |
|------|--------|----------|----------------|
| RBAC | PC | `PermissionProvider`, `permission-matrix.ts`, `useFilteredNavItems.ts`, `PermissionGate.tsx`; middleware role routing only | Roll `PermissionGate` beyond settings; live permission API; session permission snapshot |
| Registration | PC | `officer/register`, `useMyRegistrations`, `borrowerService` mock+API | Live registration/conflict APIs; photo upload to storage |
| Approvals | PC | Pending/reviewed panels, `useApprovalActions`, service layer complete | Live approve/reject/blacklist endpoints |
| Collectors | PC | List/profile panels, `collectorManagementService`, profile builder | Live collector CRUD API |
| Groups | PC | List/detail, `groupService`, risk cards | Live group mutation APIs |
| Risk & Flags | PC | `risk-flags` page, `useRiskFlags`, aside detail | Live flag resolution API |
| Loan Pools | PC | `LoanPoolsPanel`, `useLoanPools` | Live pool replenishment API |
| Reports | PC | 7 report routes, `reportService`, export/print wired | Live report generation endpoints |
| Audit | PC | Audit log report + auditor route, `auditService` | Live audit write/read API |
| User Management | PC | `SettingsUsersSection`, mutations hooks | Live user CRUD API |
| Settings | PC | Multi-section settings, `settingsService` | Persist settings to backend |
| Expenses | PC | Collector expenses + admin summary widgets | Live expense submission API |
| Reconciliation | PC | Collector reconciliation flow, tests | Live reconciliation API |
| Notifications | PC | Inbox drawer, unread count hook | Live push/delivery API |
| Search | PC | Global search modal, role-scoped `searchService` | Live search index API |
| Profile Photos | PC | `PhotoUpload`, `WebcamCapture`, validation utils | Dedicated upload service + CDN/storage |
| Print | FC | `print-engine.ts`, page numbers, tests | None (client-side) |
| Export | FC | CSV + Wilms export actions, toolbar sizing fixed P11d | None (client-side) |
| Uploads | NS | No `IUploadService`; photos held as `File` in forms | Define upload service + API |
| Phone Capture | PC | `PhoneCaptureSessionPanel`, `photoCaptureSessionService` mock | Live capture session API (stub rejects `simulatePhoneCapture` in API mode) |
| App Lock | FC | PIN setup, overlay, focus trap, 7 tests | None (client-side) |
| Dashboards | PC | Super Admin + Collector dashboards service-driven | Live dashboard summary API |

---

## P11f-F ÔÇö Backend Integration Readiness

### Service layer inventory (verified counts)

| Layer | Count |
|-------|-------|
| `I*Service` interfaces | 22 |
| `src/services/*Service.ts` API stubs | 22 |
| `src/services/mock/*Service.mock.ts` | 22 |
| `IDataProvider` exports | 22 services |
| Next.js API routes | 2 (`/api/auth/login`, `/api/auth/logout`) |

Provider switch: `resolveDataProviderMode()` in `src/data-provider/types.ts`; dev always mock; prod uses API when `NEXT_PUBLIC_API_BASE_URL` set.

### Per-domain readiness

| Domain | Frontend service | Mock | API stub | Live backend | Rating |
|--------|------------------|------|----------|--------------|--------|
| Auth | Yes | Yes | Yes | Partial (login/logout routes) | **Partially Ready** |
| Registration | Yes | Yes | Yes | No | **Partially Ready** |
| Approvals | Yes | Yes | Yes | No | **Partially Ready** |
| Collectors | Yes | Yes | Yes | No | **Partially Ready** |
| Groups | Yes | Yes | Yes | No | **Partially Ready** |
| Risk & Flags | Yes | Yes | Yes | No | **Partially Ready** |
| Loan Pools | Yes | Yes | Yes | No | **Partially Ready** |
| Reports | Yes | Yes | Yes | No | **Partially Ready** |
| Audit | Yes | Yes | Yes | No | **Partially Ready** |
| User Management | Yes | Yes | Yes | No | **Partially Ready** |
| Settings | Yes | Yes | Yes | No | **Partially Ready** |
| Expenses | Yes | Yes | Yes | No | **Partially Ready** |
| Reconciliation | Yes | Yes | Yes | No | **Partially Ready** |
| Notifications | Yes | Yes | Yes | No | **Partially Ready** |
| Search | Yes | Yes | Yes | No | **Partially Ready** |
| Dashboards | Yes | Yes | Yes | No | **Partially Ready** |
| Payments/Transactions | Yes | Yes | Yes | No | **Partially Ready** |
| Adjustments | Yes | Yes | Yes | No | **Partially Ready** |
| Overpayment Review | Yes | Yes | Yes | No | **Partially Ready** |
| Collection Metrics | Yes | Yes | Yes | No | **Partially Ready** |
| Phone Capture | Yes | Yes | Yes | No | **Partially Ready** |
| Uploads | No | No | No | No | **Missing** |
| Print | N/A client | N/A | N/A | N/A | **Ready** |
| Export | N/A client | N/A | N/A | N/A | **Ready** |
| App Lock | N/A client | N/A | N/A | N/A | **Ready** |

### Readiness percentages (calculated)

**Frontend swap readiness** (interface + mock + API stub present): **22/22 = 100%**

**Live backend endpoint readiness** (working server routes beyond mocks): **1/22 Ôëê 4.5%** (auth only)

**Weighted domain readiness** (Ready=100%, Partial=50%, Missing=0%; 22 user-facing domains):

- Ready (3): Print, Export, App Lock
- Partial (18): All service-backed domains
- Missing (1): Uploads

**Overall = (3├ù100 + 18├ù50 + 1├ù0) / 22 = 54.5%**

---

## Files Changed (P11f)

| File | Change |
|------|--------|
| `src/services/mock/collector-profile.builder.ts` | New profile assembler; derive risk from collection rate |
| `src/types/collector-management.ts` | Extended `CollectorDetail` profile types |
| `src/services/mock/collectorManagementService.mock.ts` | Uses profile builder |
| `src/features/collector-management/components/CollectorProfilePanel.tsx` | Service-driven profile |
| `src/features/approval-workflow/components/PendingApplicationReview.tsx` | Removed mock imports |
| `src/components/ui/Drawer.tsx` | `hideHeader` prop |
| `src/components/layout/shell/DashboardShell.tsx` | Executive drawer hideHeader; fix mobile nav closing on open (pathname-only effect) |
| `src/components/layout/shell/navbar/ShellNavbarActions.tsx` | Compact connection chip |
| `src/components/layout/shell/navbar/UserProfileMenu.tsx` | 44px touch, truncate |
| `src/components/layout/shell/navbar/NotificationInboxPanel.tsx` | 44px trigger |
| `src/components/theme/ThemeToggle.tsx` | 44px button |
| `src/components/layout/shell/navbar/AppLockNavbarButton.tsx` | 44px Lock icon |
| `src/components/layout/shell/navbar/ConnectionStatusChip.tsx` | Compact mobile labels |
| `src/tests/layouts/shells.test.tsx` | Wrap `PermissionProvider` |
