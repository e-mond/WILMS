# P11i Layout Alignment Audit

## Loans / Disbursements
- `ManagementToolbar` uses a single desktop row at `lg+`: search/filters left, status pills inline, actions right with `nowrap`.
- `LoanPortfolioList` places cycle filter in `secondaryFilters`; status pills live in the primary filter row.

## Risk & Flags
- Shares `FilterPillBar` fix (no `lg:flex-wrap`); pills stay on one horizontal row at desktop widths.

## Auditor Reports
- `ReportsIndexPanel` supports `categoryFilterMode="auditor"` with service-driven category mapping from `auditor-report-filters.ts`.
- Desktop toolbar keeps search, category pills, and export actions on one row via `ManagementToolbar`.

## Validation
- Manual review at 1024px+ breakpoints; automated coverage in `ManagementToolbar` / layout component tests where present.
