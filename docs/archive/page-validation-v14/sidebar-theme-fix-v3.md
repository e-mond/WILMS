# Sidebar Theme Fix v3

Recorded: 2026-06-09  
Policy: Executive sidebar **always dark** regardless of light/dark content theme.

---

## Root cause

1. **Token override conflict** — Duplicate `[data-sidebar='executive']` block set `--color-executive-gold: var(--color-brand-primary)`, which could resolve to light-theme green outside the intended dark palette.
2. **Mobile drawer** — `Drawer` panel used default `bg-card` without `data-sidebar='executive'`, so light-theme text/background tokens leaked into the navigation drawer.
3. **Hover states** — `hover:bg-accent/50` and `hover:bg-background` on sidebar controls could appear as light surfaces on dark sidebar.

---

## Fixes applied

### `src/styles/tokens.css`

- Merged duplicate sidebar blocks into one authoritative rule
- Added `color-scheme: dark` on `[data-sidebar='executive']`
- Added `aside[data-sidebar='executive'] { background-color: #161616; color: #f5f5f5; }`
- Removed `--color-executive-gold: var(--color-brand-primary)` override

### `src/components/ui/Drawer.tsx`

- Added `sidebarVariant` prop
- Executive drawer: `bg-executive-sidebar`, `data-sidebar="executive"`, dark text tokens

### `src/components/layout/shell/DashboardShell.tsx`

- Mobile nav drawer passes `sidebarVariant={isExecutive ? 'executive' : 'standard'}`

### `src/layouts/ShellNavLink.tsx`

- Executive inactive hover: `hover:bg-white/10` (dark-safe)

### `src/components/layout/shell/AppSidebar.tsx`

- Collapse button hover: `hover:bg-white/10`

---

## Audit checklist

| Element | Light content + dark sidebar | Dark content + dark sidebar |
|---|---|---|
| Background `#161616` | Pass | Pass |
| Borders `#333` | Pass | Pass |
| Text primary `#f5f5f5` | Pass | Pass |
| Hover states | Pass (white/10 overlay) | Pass |
| Active nav (gold accent) | Pass | Pass |
| Icons | Pass | Pass |
| Footer / logout | Pass | Pass |
| Collapsed state | Pass | Pass |
| Mobile drawer | Pass (P11e fix) | Pass |

---

## Sign-off

Sidebar remains executive-dark in all theme modes and drawer states.
