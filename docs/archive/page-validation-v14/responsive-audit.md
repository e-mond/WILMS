# Responsive / Mobile Audit
> **Date:** 2026-06-09 (re-verified after P7–P9)  
> **Scope:** Super Admin office shell (PWA)

---

## Breakpoints verified

| Breakpoint | Width | Sidebar | AppAside | Navbar | Tables / forms |
|---|---|---|---|---|---|
| Mobile | 390px | Drawer overlay | Context drawer (`expectShellAsideDrawerAccess`) | Collapsed controls | Card-first layouts; tables hidden or scroll-contained |
| Tablet | 768px | Drawer / partial | Drawer until xl | Search + notifications visible | Grid KPIs 2-col; reports table visible |
| Laptop | 1280px | Collapsible persistent | Persistent `#app-aside` | Full header | Executive tables with `overflow-x-auto` on table wrapper |
| Desktop | 1536px | Collapsible persistent | Persistent aside | Full header | Multi-column layouts |
| Large | 1920px+ | Same as desktop | Same | Same | Content max-width via shell grid |

---

## Shell behaviour

| Feature | Mobile | Tablet | Laptop+ |
|---|---|---|---|
| Sidebar collapse toggle | Via drawer | Via drawer / toggle | ✅ Persistent toggle |
| Right aside | Drawer trigger | Drawer trigger | ✅ `#app-aside` landmark |
| Global search | Dialog overlay | Dialog overlay | Dialog overlay |
| Notifications | Drawer | Drawer | Drawer |
| Theme toggle | ✅ | ✅ | ✅ |

---

## Page-level notes (post P7–P9)

| Page | Issue found | Resolution |
|---|---|---|
| Dashboard | None critical | KPI grid stacks; aside via drawer |
| Borrowers / Applications | None critical | Filter pills wrap; table scroll contained |
| Loan Pools | None critical | Aside E2E covered |
| Disbursements | None critical | Filters stack on sm |
| Collections | None critical | Date + collector filters stack |
| Collectors / Groups | None critical | E2E covered |
| Risk & Flags | Pagination cramped on narrow widths | ✅ Pagination stacks vertically on mobile |
| Audit Log | None critical | Filter grid responsive |
| **Reports index** | Wide table duplicated card UX on mobile | ✅ Table hidden `<md`; card grid primary on mobile |
| **Settings** | Long category list on mobile | ✅ Horizontal scroll category strip below `xl`; vertical nav at `xl+` |
| **Settings modals** | Invite/edit dialog overflow on short viewports | ✅ Modal `max-h-[90vh]` + scrollable body |
| Borrower / Group profile | None critical | Profile grids use sm:2 cols |

---

## Component-level fixes (P5)

| Component | Change |
|---|---|
| `Modal` | `max-h-[90vh]`, scrollable body, wrapping footer |
| `SettingsPanel` | Horizontal category nav below xl; `min-w-0` content column; export actions scroll container |
| `ReportsIndexPanel` | Table `hidden md:block`; card grid tuned for sm/md/lg/xl |
| `RiskFlagsPanel` | Pagination footer stacks on mobile |

Shared primitives already responsive:

- `ExecutiveKpiGrid` → `sm:grid-cols-2 xl:grid-cols-4`
- `ManagementToolbar` → column stack → row at `lg`; filter pill horizontal scroll container
- `DataTable` → `overflow-x-auto` wrapper
- `SettingsSectionCard` / `SettingsSettingRow` → stacked controls below `sm`

---

## Export / print (P0 fix)

| Check | Status |
|---|---|
| Print uses hidden iframe (no popup) | ✅ |
| Print failure shows toast, no throw | ✅ |
| Export buttons `print:hidden` | ✅ |

---

## E2E coverage

`e2e/shell-navbar.spec.ts` validates mobile aside drawer + laptop persistent aside for:

- Dashboard, Collectors, Groups, Loan Pools, Risk & Flags, Settings, **Reports**

Additional P5 checks in `shell-navbar.spec.ts`:

- Settings mobile category navigation (horizontal strip)
- Reports mobile context drawer (`Report Categories`)

`e2e/responsive-breakpoints.spec.ts` validates login + office/collector shells at 375 / 768 / 1280 / 1536.

---

## Residual (non-blocking)

- Individual report sub-routes not individually E2E-tested for aside drawer; inherit same shell behaviour.
- Full WCAG automated audit tracked under QA-03 (`context/accessibility-audit.md`).
