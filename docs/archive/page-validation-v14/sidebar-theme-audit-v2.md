# Sidebar Theme Audit v2

Recorded: 2026-06-09

## Policy

The executive sidebar **always** uses the dark WILMS navigation theme regardless of main content light/dark mode.

## Token enforcement

| Token | Light content / Dark content | Sidebar (`[data-sidebar='executive']`) |
|---|---|---|
| `--color-executive-sidebar` | Was `#f5f4f0` in `:root` | **Fixed to `#161616` in `:root`** + enforced on `[data-sidebar='executive']` |
| Text primary | Theme-dependent | `#f5f5f5` on sidebar |
| Brand primary | Green (light) / Gold (dark) | Gold on sidebar |
| Background | Theme-dependent | `#161616` |

**Fix applied:** `:root --color-executive-sidebar` changed from `#f5f4f0` to `#161616` so `bg-executive-sidebar` is dark even before attribute selectors apply.

## Component audit (`AppSidebar.tsx`)

| Element | Status | Notes |
|---|---|---|
| Background | Pass | Inherits from `DashboardShell` `bg-executive-sidebar` |
| Hover states | Pass | `hover:bg-accent/50` on nav + collapse button |
| Active nav | Pass | Via `ShellNavLink` executive variant |
| Icons | Pass | Lucide chevrons for collapse |
| Dividers | Pass | `border-border` header/footer |
| Footer | Pass | Logout + version when expanded |
| User section | Pass | Role label in `WilmsBrandMark` |

## Collapse behaviour

| State | Expected | Actual |
|---|---|---|
| Expanded | Logo left, collapse top-right | Pass — collapse button `absolute right-2 top-3` |
| Expanded footer | Logout + version | Pass |
| Collapsed | Brand icon only | Pass — `WilmsBrandMark compact` |
| Collapsed footer | Logout icon only, version hidden | Pass |
| Width | 240px / 64px | Pass — `w-60` / `w-16` in `DashboardShell` |

## Responsive

| Viewport | Behaviour |
|---|---|
| Desktop | Fixed sidebar column |
| Tablet | Same; main content compresses |
| Mobile | Sidebar hidden; office profile uses `Drawer` with same `AppSidebar` content |

## Sign-off

Sidebar remains **executive dark** in both light and dark content themes. Collapse layout matches P11c specification.
