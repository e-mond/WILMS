# WILMS Design System (v1.6.1)

Source of truth for runtime tokens: `apps/frontend/src/styles/tokens.css` and `globals.css`.

## Spacing & radius

Use Tailwind `wilms-*` spacing scale and CSS radius tokens (`--radius-control`, `--radius-card`).

## Color

Semantic status colors (`success`, `danger`, `warning`, `info`) and brand primary. Dark theme mirrors under `.dark` / `[data-theme='dark']`.

## Typography

Prefer existing text utilities: `text-display`, `text-heading-2`, `text-body`, `text-small`. KPI values use `tabular-nums`.

## Elevation & motion

- Navbar: `--shadow-navbar` when elevated
- Cards: `.motion-card-lift`
- Skeletons: `.skeleton-shimmer`
- Respect `prefers-reduced-motion`

## Components

Prefer shadcn-styled WILMS wrappers under `apps/frontend/src/components/ui` and data-display primitives under `components/data-display`.
