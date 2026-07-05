# Performance Report (v1.1 Final)

**Date:** 2026-07-05

## Impact assessment

v1.1 stabilization changes are UI-only with negligible bundle impact:

| Change | Impact |
|--------|--------|
| QueryErrorState / GuidedEmptyState | ~2KB gzipped combined |
| ModulePageIntro on 18 pages | Client component; collapsed by default |
| PWA PNG icons | Static assets; 20KB total |
| Search highlight | O(n) per result row; max 8 results |
| Dashboard Recent Activity | Reuses existing dashboard payload |

## Build output

Production build completes successfully with no new dynamic import regressions.

## Existing optimisations

- Route-level code splitting (Next.js App Router)
- Dynamic imports on heavy panels (loan pools, risk flags, reports)
- TanStack Query stale times
- Docker build excludes docs/tests

## Recommendations (deferred)

- Add Lighthouse CI on `/dashboard` and `/login`
- Lazy-load PDF export utilities on report pages
- Profile collector dashboard on low-end mobile devices

## Lighthouse

Manual run recommended before release; not automated in this PR.
