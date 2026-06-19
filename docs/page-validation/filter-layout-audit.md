# Filter Layout Audit

Recorded: 2026-06-09

---

## Issue

`FilterPillBar` used `flex-wrap`, causing awkward multi-line breaks and uneven spacing in toolbars with search + multiple filter groups.

---

## Fixes applied

### `FilterPillBar.tsx`

| Breakpoint | Behaviour |
|---|---|
| Mobile / tablet | `flex-nowrap overflow-x-auto` horizontal scroll strip |
| Desktop (`lg+`) | `flex-wrap` allowed for single-line / secondary row when needed |
| All | `min-h-[44px]` pills, hidden scrollbar |

### `ManagementToolbar.tsx`

- Filter slot: `overflow-x-auto lg:overflow-visible`

### `MyRegistrationsList.tsx`

- Dual filter bars wrapped in horizontal scroll container (status + date)

---

## Pages audited

| Page | Filters | Status |
|---|---|---|
| Risk & Flags | Status pills | Fixed |
| Borrowers | Status pills | Fixed |
| Groups | Status pills | Fixed |
| Loan Pools | Status pills | Fixed |
| Reports index | Report type pills | Fixed |
| Collectors | Status pills | Fixed |
| My Registrations | Status + date pills | Fixed (dual strip) |

---

## Sign-off

Filters no longer wrap randomly on mobile/tablet; desktop allows controlled wrap at `lg+`.
