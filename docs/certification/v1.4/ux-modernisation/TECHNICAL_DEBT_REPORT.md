# Technical Debt Report — v1.4 UX Modernisation

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Debt inventory (current)

| ID | Area | Debt | Risk | Recommendation |
|----|------|------|------|----------------|
| TD-01 | Design system | Custom UI primitives without Radix/Shadcn | Medium | Incremental adoption behind wrappers; do not big-bang rewrite |
| TD-02 | Components | Duplicate table/skeleton helpers (`PageSkeletons` vs `TableSkeleton`) | Low | Consolidate under `components/feedback` |
| TD-03 | Search | Global search still modal-based, not full command palette with actions | Medium | Extend with navigation + settings actions in a later pass |
| TD-04 | Pagination | Cursor pagination only wired for borrowers (Phase 25) | Medium | Expand to payments/loans/groups/expenses |
| TD-05 | Docs | Many v1.3.x certification docs still stamped 1.3.8 | Low | Keep as historical; hub points to 1.4.0 |
| TD-06 | Frontend | Some role icons reused (e.g. expenses using `reports` icon) | Low | Add dedicated icons |
| TD-07 | A11y | No automated axe CI gate in this pack | Medium | Add axe/playwright accessibility smoke |
| TD-08 | Bundle | Full route-level lazy audit not re-run this pack | Medium | Re-run `bundle:budget-check` before next release tag |

## Debt closed this pack

- Ungrouped Super Admin nav
- Tall / sparse desktop navbar
- Tour welcome control race on “never show”
- Stale version stamps in primary entry docs
