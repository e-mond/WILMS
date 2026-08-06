# Table Modernization Report (v1.6.1)

## Shared `DataTable`

- Sticky `thead` for long lists.
- Empty state with illustration placeholder, primary message, and guidance copy.
- Density tokens (`--density-table-cell-y`) available for future cell padding alignment.
- Executive variant retained for management surfaces.

## Coverage

Applied through the shared component used by borrowers, groups, loans, communications, notifications-related lists, reconciliations, reports, and audit-adjacent tables that already consume `DataTable`.

## Deferred (documented)

Full virtualization, column resizing, and server-side sort APIs are not introduced in this polish sprint to avoid contract churn. Prefer incremental adoption when list sizes demand it.
