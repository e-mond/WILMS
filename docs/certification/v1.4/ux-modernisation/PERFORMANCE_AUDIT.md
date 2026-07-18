# Performance Audit — v1.4 UX Modernisation (Delta)

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## This pack

| Change | Perf impact |
|--------|-------------|
| Nav grouping | Negligible (pure client grouping) |
| Search grouping / skeletons | Negligible; skeleton replaces text “Searching…” |
| Navbar densification | Neutral / positive (less chrome height) |
| Skeleton shimmer CSS | GPU-friendly gradient; disabled under reduced motion |

## Carry-forward (Phase 25 / v1.3.8)

- Cursor pagination foundation on borrowers — expand to other lists
- KPI paths must remain SQL-derived (do not reintroduce 2000-row in-memory traps)
- Bundle budget scripts exist (`npm run bundle:budget-check`) — **not re-executed as release gate in this pack**

## Recommendation

Before tagging a UX-focused release candidate, run:

```bash
npm run bundle:budget-check
npm run perf:budget-check
npm run test -w @wilms/api
npm run type-check
```
