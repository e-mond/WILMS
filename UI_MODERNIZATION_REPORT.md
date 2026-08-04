# UI Modernization Report — v1.5.0

## Scope for this release

Incremental polish on the existing shadcn-based shell while the platform consolidates. No wholesale redesign that would block API cutover.

## Changes

- Sticky app navbar retains backdrop blur; added `motion-safe` transition respect for reduced-motion users
- Shell already provides sticky sidebar, mobile bar, global search, breadcrumbs
- Financial workflow friendly errors from v1.4.3 remain in place

## Follow-on (post-DoD)

Continue replacing any remaining manual primitives with shadcn components: permission catalog density, empty states, table skeletons, onboarding tour pacing (Hick’s / Jakob’s Law).
