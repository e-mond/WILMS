# Accessibility Report — v1.4 UX Modernisation

**Date:** 2026-07-18  
**Standard target:** WCAG 2.2 AA  
**Author:** WILMS Engineering  
**Method:** Code review + existing a11y patterns; **not** a full automated axe sweep of every route.

## Improvements this pack

| Area | Change |
|------|--------|
| Breadcrumbs | `aria-current="page"`; chevron separators; narrow collapse with ellipsis |
| Navbar controls | Consistent focus-visible rings; labelled icon buttons |
| Help | Shared dialog via header + FAB; focus via existing Modal |
| Tour | Explicit button actions; exit/continue wording clarified |
| Motion | Global `prefers-reduced-motion` already present; shimmer/tour animations gated |
| Search | Grouped sections with `aria-label`; polite live region retained |

## Known residual gaps (deferred)

| ID | Gap | Priority |
|----|-----|----------|
| A11Y-01 | No CI axe gate on critical routes | P1 |
| A11Y-02 | Some dense tables may still have limited mobile horizontal strategy | P2 |
| A11Y-03 | Full keyboard audit of every settings sub-panel not repeated | P2 |

## Claim level

**Partial conformance evidence** for chrome changes. Do **not** claim full WCAG 2.2 AA certification from this pack alone.
