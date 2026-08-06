# Dashboard Redesign Report (v1.6.1)

## Objectives

Make every role dashboard feel enterprise-grade: clearer hierarchy, denser but readable KPI surfaces, and modern activity presentation — without changing metric definitions.

## Changes

### Shared KPI surface

- `KpiCard` gains trend Lucide icons, `tabular-nums`, optional `isLoading` skeleton, optional `sparkline` slot, and `motion-card-lift` hover.
- Decorative sparklines via `Sparkline` + `buildTrendSparklineValues()` (visual only; not a new time-series API).

### Super Admin

- Executive KPI grid wired with sparklines and trend strokes by direction.
- Recent activity uses a vertical `timeline-rail` with severity icons and deep links.
- Existing collection / reconciliation / expense / collector performance panels retained.

### Collector

- Hero collection progress rendered as an accessible `progressbar` with width animation (reduced-motion safe).

### Officer / Approver / Auditor

- Continue to use shared shell, KPI, and table primitives; loading skeletons and executive density tokens apply through the shell and `DataTable`/`KpiCard` upgrades.

## Charts

Typography, empty states, and spacing inherit from existing analytics panels; no financial series formulas were altered.

## Follow-ups (optional)

- Persist real period-over-period series from the domain when product prioritizes historical KPI APIs.
- Role-specific chart packs (auditor-only reconciliation trend) once data contracts exist.
