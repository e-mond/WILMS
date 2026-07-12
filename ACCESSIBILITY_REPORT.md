# Accessibility Report — v1.3.6-rc1

**Date:** 2026-07-12  
**Target:** WCAG 2.2 AA

---

## Changes reviewed

| Component | Impact |
|-----------|--------|
| Collector settings nav | Fewer duplicate entries — improved clarity |
| Collectors aside panel | Display id readable (COL-###) — screen reader benefit |
| Message modal error text | `text-danger` error state when thread fails |

## Automated axe (prior cycle)

v1.3.5 pass retained for login, dashboards after contrast fix (`DashboardRecentActivity.tsx`).

## v1.3.6-specific

No new interactive patterns. App Lock remains single entry under Settings with existing `PinEntryPad` ARIA (`role="status"`, labelled digits).

## Keyboard

Settings category buttons unchanged — keyboard operable.

## Certification

No accessibility regressions identified in changed files. Full axe re-run recommended on staging before v1.4.0 stable.
