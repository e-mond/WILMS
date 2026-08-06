# Design System Report (v1.6.1)

## Tokens (`apps/frontend/src/styles/tokens.css`)

| Token | Purpose |
|-------|---------|
| `--motion-fast/base/slow` | Transition durations |
| `--shadow-navbar` | Elevated sticky header |
| `--shadow-card-hover` | KPI / card lift |
| `--density-kpi-padding` | KPI card padding |
| `--density-table-cell-y` | Table density |
| `--focus-ring` | Focus affordance |
| Radius / brand / status colors | Unchanged semantic palette |

## Utilities (`globals.css`)

- `.motion-card-lift`, `.motion-enter-fade`, `.skeleton-shimmer`, `.navbar-elevated`, `.timeline-rail`
- Reduced-motion overrides

## Component alignment

Prefer shared UI primitives (`Button`, `Input`, `Select`, `Modal`, `Drawer`, `Badge`, `DataTable`, `KpiCard`) over one-off chrome. See `docs/ui/DESIGN_SYSTEM.md` and `docs/ui/UI_GUIDELINES.md`.
