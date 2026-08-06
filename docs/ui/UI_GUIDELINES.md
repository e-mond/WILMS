# WILMS UI Guidelines (v1.6.1)

## Principles

1. **One job per section** — avoid stacking unrelated KPIs without hierarchy.
2. **Shared primitives** — use `Button`, `Input`, `Select`, `Modal`, `Drawer`, `DataTable`, `KpiCard`.
3. **Enterprise density** — prefer tokens (`--density-*`) over one-off padding.
4. **Accessible by default** — visible focus, semantic labels, reduced motion.
5. **Motion is feedback** — short transitions only; never block comprehension.

## Do / Don't

| Do | Don't |
|----|-------|
| Sticky headers for long tables | Mid-word wrapping of IDs/amounts |
| Trend + sparkline for KPI context | Invent financial series without API backing |
| Grouped, role-aware nav | Duplicate destinations across roles |
| Empty states with next action | Blank white voids |

## Surfaces

- Shell: sticky navbar, collapsible sidebar groups, command search
- Dashboards: executive KPI grid + timeline activity
- Inbox: notification categories + clear read
- Comms: compose counters + campaigns history
