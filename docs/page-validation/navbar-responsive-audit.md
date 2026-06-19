# Navbar Responsive Audit

Recorded: 2026-06-09

## Components

| Component | Path |
|---|---|
| Desktop navbar | `src/components/layout/shell/AppNavbar.tsx` |
| Mobile office bar | `src/layouts/OfficeShellMobileBar.tsx` |
| Action cluster | `src/components/layout/shell/navbar/ShellNavbarActions.tsx` |
| Search trigger | `src/components/layout/shell/navbar/GlobalSearchPanel.tsx` |
| Notifications | `NotificationInboxPanel.tsx` / `NotificationInboxTrigger` |
| Connection status | `ConnectionStatusChip.tsx` |
| App lock | `AppLockNavbarButton.tsx` |
| Profile | `UserProfileMenu.tsx` |

---

## Fixes applied (P11e)

### Desktop (`md+`)

| Requirement | Fix |
|---|---|
| Search centered | `AppNavbar` uses 3-column grid; `GlobalSearchTrigger variant="desktop"` in center column |
| Actions right-aligned | `ShellNavbarActions hideSearch` in right column |
| No overlap | Breadcrumbs truncate; datetime hidden below `2xl` |

### Laptop

| Requirement | Fix |
|---|---|
| No clipping | `min-w-0` on grid columns; compact action gaps |
| Profile visible | Profile menu remains in action cluster |

### Tablet

| Requirement | Fix |
|---|---|
| Search accessible | Center search visible from `md`; mobile bar shows compact search icon |
| Actions accessible | Icon-first action buttons with 44px min height on search trigger |

### Mobile

| Requirement | Fix |
|---|---|
| All actions visible | `OfficeShellMobileBar` + `ShellNavbarActions compact` |
| Search | `GlobalSearchTrigger` icon button (44px) always visible when logged in |
| No overflow | `min-w-0 flex-1` on title area; action cluster `gap-1.5` |

---

## Verification matrix

| Control | Mobile | Tablet | Laptop | Desktop |
|---|---|---|---|---|
| Search | Icon → modal | Icon / centered bar | Centered bar | Centered + Ctrl K |
| Notifications | Trigger visible | Yes | Yes | Yes |
| Online/offline | `ConnectionStatusChip` | Yes | Yes | Yes |
| Settings | Ghost icon 36px+ | Yes | Yes | Yes |
| Lock | `AppLockNavbarButton` | Yes | Yes | Yes |
| Profile | `UserProfileMenu` | Yes | Yes | Yes |
| Theme toggle | Visible | Yes | Yes | Yes |

---

## Sign-off

Navbar responsive pass complete. No dashboard changes.
