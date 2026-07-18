# Design System Migration Report

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Current state

WILMS uses **custom** primitives under `apps/frontend/src/components/ui/`:

Button, Input, Textarea, Select, Checkbox, Switch, Modal, Drawer, Badge, Pagination, ProgressBar, LoadingButton.

**Shadcn/UI and Radix are not installed.**

## Decision this pack

**Do not** perform a blind Shadcn rewrite. That would risk domain regressions (financial forms, offline collector flows, executive shell).

## Migration strategy (approved direction)

1. Keep WILMS wrappers as the public API (`@/components/ui/*`).
2. Optionally adopt Radix primitives **inside** wrappers in a dedicated PR series.
3. Consolidate duplicate feedback/table skeletons first.
4. Prefer domain components for business behaviour (loan panels, reconciliation, registration wizard).

## Completed this pack

- Token additions for motion/radius/shell dimensions
- Shared skeleton shimmer
- Consistent navbar control sizing

## Deferred

- Install `radix-ui` / shadcn scaffolding
- Replace Modal/Drawer internals
- Form library alignment (RHF + shadcn Form)
