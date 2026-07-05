# RC1 ÔÇö Loading UX

**Gate:** GATE 4  
**Date:** 2026-06-30

---

## New primitives

| Component | Path |
|-----------|------|
| `Skeleton` | `components/feedback/Skeleton.tsx` |
| `CardSkeleton` | `components/feedback/CardSkeleton.tsx` |
| `TableSkeleton` | `components/feedback/TableSkeleton.tsx` |
| `QueryStatePanel` | `components/feedback/QueryStatePanel.tsx` |

---

## States standardized

`QueryStatePanel` handles:

- **Loading** ÔåÆ table/card/inline skeleton
- **Error** ÔåÆ friendly message + retry button
- **Empty** ÔåÆ `EmptyState`
- **Refreshing** ÔåÆ opacity transition on success children

---

## Rollout

| Priority | Panels | Status |
|----------|--------|--------|
| P0 Reports | `LoanPortfolioReportPanel` | Migrated to `QueryStatePanel` |
| P0 Other GATE 1 pages | Dashboard, borrowers, loans, etc. | Existing `LoadingSpinner` (migrate incrementally) |
| Remaining ~50 panels | Feature panels | Pattern documented; spinner baseline retained |

---

## Anti-patterns fixed

- No flash of empty UI before loading completes on migrated panels
- Error state no longer conflated with empty state

---

**Verdict:** Skeleton infrastructure in place; P0 report panel migrated. Remaining panels follow same pattern in v0.2.3 polish.
