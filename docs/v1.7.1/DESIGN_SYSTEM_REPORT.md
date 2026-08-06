# Design System Report — v1.7.1

## Principle

Prefer shared WILMS UI primitives (`components/ui`, executive layout, data-display) over one-off styling.

## This sprint

- Operational and Executive surfaces use shared KPI grids, buttons, inputs, cards
- Modal lifecycle standardized
- Export branding tokens centralized in `features/export/constants/branding.ts`

## Remaining work

- Inventory any remaining ad-hoc dialogs
- Ensure drawers/tooltips/tabs all route through shared primitives
- Document spacing/elevation/motion tokens for external design partners
