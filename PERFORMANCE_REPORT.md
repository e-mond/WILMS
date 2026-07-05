# Performance Report (v1.1)

**Date:** 2026-07-05  
**Branch:** `feature/v1.1-user-experience`

## Audit summary

v1.1 UX changes are lightweight and do not materially affect bundle size:

| Change | Performance impact |
|--------|-------------------|
| `ModulePageIntro` | Client component; collapsed by default — negligible |
| `HighlightedText` | O(n) string split per search result row — acceptable at limit 8 |
| `DashboardRecentActivity` | Renders up to 5 alert items from existing dashboard payload — no extra API call |
| Notification filters | Client-side filter on existing inbox query — no extra network |
| Search match utils | Shared pure functions — tree-shakeable |

## Existing optimisations retained

- Dynamic imports on heavy panels (loan pools, risk flags, reports)
- TanStack Query stale times on search (30s) and dashboard hooks
- Next.js App Router code splitting per route
- Docker build excludes docs and test artifacts

## Recommendations (deferred)

- Add Lighthouse CI gate on `/dashboard` and `/login`
- Lazy-load export PDF utilities on report pages
- Evaluate route-level `loading.tsx` coverage for remaining static imports

No regressions expected from v1.1 UX diff.
