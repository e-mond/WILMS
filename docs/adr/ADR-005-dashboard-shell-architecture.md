# ADR-005 — Dashboard Shell Architecture

**Status:** Accepted
**Date:** 2026-06-08

---

## Context

Approved reference JPEGs (`context/design-references/`) require a unified four-region shell:

```text
AppNavbar (full width)
├── AppSidebar (collapsible)
├── MainContent
└── AppAside (contextual right rail)
OfficeShellFooter
```

WILMS previously used `OfficeShell` (office roles) and `CollectorShell` (field) with separate implementations and no collapsible sidebar or shell-level aside.

---

## Decision

### Single composer: `DashboardShell`

All authenticated role layouts compose `DashboardShell` from `src/components/layout/shell/`.

| Component | Responsibility |
|---|---|
| `AppNavbar` | Breadcrumbs, LIVE badge, datetime, theme, profile slots (search/notifications added in NB-*) |
| `AppSidebar` | Navigation, collapse toggle, mobile drawer |
| `ShellMainLandmark` | `<main id="main-content">` + sr-only page title |
| `AppAside` | Shell right rail (xl+); hidden on field mobile |
| `OfficeShellFooter` | Sync status bar |

### Shell profiles

| Profile | Roles | Notes |
|---|---|---|
| `office` | Super Admin, Approver, Registration Officer | AppAside visible xl+ |
| `field` | Collector | Bottom nav mobile; `CollectorOfflineShell` wrapper; AppAside optional |

### State: `shellLayoutStore`

- `isSidebarCollapsed` (persisted localStorage)
- `toggleSidebarCollapsed`, `setSidebarCollapsed`

Mobile nav remains in `uiStore` (`isMobileNavOpen`).

### Aside content

- `AsideSlotProvider` allows pages to inject aside content via `useAsideSlot()`
- Default: empty placeholder until PG-* page work lands

### Preserved ADRs

- **ADR-002:** Route groups unchanged; role-restricted navbar slots render `null`
- **ADR-004:** Shell components are Tier 2 (`layout/shell/`)

---

## Consequences

- `OfficeShell` becomes a thin wrapper over `DashboardShell` (deprecated internals)
- `CollectorShell` uses `DashboardShell` with `profile="field"`
- E2E shell helpers updated for collapse toggle and aside landmark
