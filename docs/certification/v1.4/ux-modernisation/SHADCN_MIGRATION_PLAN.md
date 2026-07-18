# Shadcn/UI Migration Plan — v1.4.1

**Date:** 2026-07-18  
**Author:** WILMS Engineering  
**Status:** Planned — not fully installed

## Current inventory

Custom primitives in `apps/frontend/src/components/ui/`:

Button, Input, Textarea, Select, Checkbox, Switch, Modal, Drawer, Badge, Pagination, ProgressBar, LoadingButton.

**No** `@radix-ui/*`, **no** `components.json`, **no** shadcn CLI scaffold.

## Decision

Do **not** big-bang rewrite in this release. Financial forms and offline collector flows depend on current wrappers.

## Phased plan

1. **P0** — Inventory + single public API (`@/components/ui/*`) — **done**
2. **P1** — Add Radix behind Modal/Drawer/Tooltip wrappers without changing call sites
3. **P2** — Introduce Command (`cmdk`) behind GlobalSearchPanel
4. **P3** — Form primitives (Label, FormField) for settings
5. **P4** — Remove dead duplicate feedback components

## Guardrails

- Preserve WILMS domain components
- One design-system export path
- Visual regression + unit tests per wrapper swap
