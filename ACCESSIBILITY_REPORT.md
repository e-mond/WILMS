# Accessibility Report (v1.1 Final)

**Date:** 2026-07-05

## v1.1 improvements

| Area | Change |
|------|--------|
| Module guidance | `aria-expanded`, `aria-controls` on collapsible help |
| Global search | `aria-live="polite"`, sr-only labels, keyboard Ctrl+K |
| Notifications | Filter tabs with `role="tablist"` / `aria-selected` |
| Recent activity | `aria-label` on activity list |
| Search highlights | Semantic `<mark>` elements |
| Query errors | Structured headings in error/empty states |
| Layout | favicon + apple-touch-icon metadata |

## Baseline retained

- Skip-to-content link
- Focus-on-route-change
- 44px minimum touch targets on navbar actions
- Focus-visible rings on interactive elements

## Manual verification recommended

1. Tab through module help toggles on `/borrowers` and `/collector/dashboard`
2. Open global search with Ctrl+K, arrow through results
3. Open notification drawer, switch filter tabs with keyboard
4. Verify contrast on brand-primary buttons in dark mode

## Deferred

- Automated axe/Lighthouse CI gate
- Full screen-reader audit of all 47 routes
