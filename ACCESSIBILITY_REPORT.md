# Accessibility Report (v1.1)

**Date:** 2026-07-05  
**Branch:** `feature/v1.1-user-experience`

## Improvements in v1.1

| Component | A11y enhancement |
|-----------|------------------|
| `PageGuidanceTip` | `aria-expanded`, `aria-controls`, keyboard-operable button |
| `GlobalSearchPanel` | `aria-live="polite"` on results; sr-only search label |
| `NotificationInboxPanel` | Filter tabs with `role="tablist"` and `aria-selected` |
| `DashboardRecentActivity` | `aria-label="Recent activity"` on list |
| `HighlightedText` | Uses semantic `<mark>` for matched segments |
| `GuidedEmptyState` | Structured headings for screen reader navigation |

## Existing baseline (retained)

- Focus-visible rings on buttons and links
- Minimum 44px touch targets on navbar actions
- Role shells with landmark navigation
- Form fields with associated labels

## Known remaining gaps

- 10 feature panels still use legacy manual error guards instead of `QueryStatePanel`
- Automated axe/Lighthouse audit not yet in CI
- Some report tables rely on horizontal scroll on mobile without explicit scroll hints

## Recommendation

Run manual keyboard pass on: global search (Ctrl+K), notification filters, module guidance toggles, and guided empty state CTAs before release.
