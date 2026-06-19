# P11h Navigation Audit — Operational Roles

Date: 2026-06-09  
Reference implementation: Collector (`CollectorShell`).

Shared components: `OperationalMobileNavigation.tsx` (`OperationalMobileHeader`, `OperationalBottomNavigation`).

## Role comparison

| Aspect | Collector | Registration Officer | Approver | Auditor |
|--------|-----------|---------------------|----------|---------|
| Shared mobile header | Yes (`OperationalMobileHeader`) | Yes via `OfficeShell` + `operationalMobileNav` | Yes | Yes |
| Shared bottom nav | Yes (`OperationalBottomNavigation`) | Yes | Yes | Yes |
| Settings excluded from bottom nav | Yes (`filterOperationalBottomNavItems`) | Yes | Yes | Yes |
| Floating drawer FAB | Yes (`MobileSidebarTrigger`) | Yes | Yes | Yes |
| Executive sidebar drawer | Yes (`hideHeader`) | Yes | Yes | Yes |
| 44px nav links | Yes (`min-h-[44px]` on `ShellNavLink`) | Yes | Yes | Yes |
| Label nowrap | Yes | Yes | Yes | Yes |

## Shell wiring

- **Collector**: `DashboardShell` directly with shared header + bottom nav.
- **Registration Officer / Approver / Auditor**: `OfficeShell` with `operationalMobileNav` prop.
- **Super Admin**: Standard `OfficeShell` — simplified mobile header (no bottom nav); desktop sidebar unchanged.

## Mobile header actions (all simplified mobile bars)

- Visible: notifications, profile, overflow (`MoreVertical`).
- Overflow: search, settings, app lock, theme, connection status.

## Tests

- `src/tests/layouts/shells.test.tsx` — collector, registration officer, approver, super admin shell smoke tests pass.
