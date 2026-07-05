# Mobile Navigation Consistency Audit (P11g-D)

**Verified:** 2026-06-13

## Issues Found

### Collector

1. **Bottom nav grid mismatch** ÔÇö `COLLECTOR_NAV` has 6 items but bottom bar used `grid-cols-5`, causing Settings to wrap to a second row.
2. **Header action crowding** ÔÇö Settings competed with bottom nav; profile menu showed name block on narrow widths.

### Approver / Auditor

1. **Inconsistent mobile brand labels** ÔÇö Used generic role label instead of portal-specific titles like Collector.

## Fixes Applied

| File | Change |
|------|--------|
| `CollectorShell.tsx` | `COLLECTOR_BOTTOM_NAV` excludes Settings (header only); 5-column grid matches 5 items |
| `OfficeShellMobileBar.tsx` | Removed header menu button; `pl-12` clears floating sidebar trigger; brand not tappable for nav |
| `ShellNavbarActions.tsx` | `flex-nowrap shrink-0`; compact connection icon-only |
| `UserProfileMenu.tsx` | `compact` prop ÔåÆ avatar-only on mobile headers |
| `ConnectionStatusChip.tsx` | Icon-only in compact mode (Wifi / WifiOff) |
| `ApproverShell.tsx` | `brandTitle="WILMS Approver"` |
| `AuditorShell.tsx` | `brandTitle="WILMS Auditor"` + drawer title |
| `RegistrationOfficerShell.tsx` | `brandTitle="WILMS Registration"` |
| `SuperAdminShell.tsx` | `brandTitle="WILMS Admin"` |
| `MobileSidebarTrigger.tsx` | Dedicated 44px floating nav control (all portals with drawer) |
| `DashboardShell.tsx` | Drawer enabled for field + office shells with `mobileHeader` |

## Mobile Header Structure (all portals)

```
[ floating sidebar trigger ÔÇö outside header, left edge ]
[ sticky mobile bar: brand mark + title | action cluster ]
[ optional bottom nav ÔÇö Collector only, 5 primary routes ]
```

### Action cluster (compact)

Search ┬À Notifications ┬À Settings ┬À Lock ┬À Theme ┬À Profile (avatar)

All controls: `min-h-[44px]`, `shrink-0`, `flex-nowrap`.

## Remaining Notes

- Collector Settings remains in header + full sidebar drawer (not bottom bar).
- Desktop (`md+`) unchanged ÔÇö sidebar + `AppNavbar` grid layout.
