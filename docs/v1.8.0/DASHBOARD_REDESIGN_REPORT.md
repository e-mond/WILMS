# WILMS v1.8.0 — Dashboard Redesign Report

## Delivered (release)

- iOS-inspired tokens: larger radii, glass surfaces, soft card shadows
- Card primitive updated to glass/blur elevation
- Unique icons: expenses (card), holidays (calendar), operations (shield), documentation (book)
- Collector expenses/holidays no longer share the reports glyph
- Premium holiday calendar layout for collectors
- Role workspace heroes on Officer / Approver / Auditor home routes

## Post-release update (same v1.8.0 identity)

- Super Admin dashboard: financial KPIs first, compact “Needs attention” counters, reconciliation + activity, borrower status; removed dense work-queue prose and quick-action sprawl
- Collector dashboard: removed sticky Quick payment/Reconcile bar, entire quick-action grid, and sync/connection KPI strip; retained collection performance, alerts, groups, borrowers, recon alert
- Approver home: metrics-only counters (applications, offline backlog, review, holidays); removed explanatory action tiles
- Role workspace heroes: removed permanent Online/sync pills from hero chrome
- Shared `DataTable` mobile stack mode for responsive financial tables
- Navbar Help + connection status removed from permanent chrome; offline banner/sync panel retained
- Executive: Board guidance tab removed; forecast + KPI sections remain
- Reconciliation: stacked mobile rows, status pills, variance emphasis, detail drawer for review
- Communication Center: two-column compose console
- Raise Flag: entity search instead of Entity ID free-text

## Migration

No schema migration required for this post-release UI update.
