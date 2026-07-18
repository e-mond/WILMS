# Permission Catalog Review — v1.4.1

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Before

Card grid with mono permission IDs wrapping and dominating the layout.

## After

`PermissionCatalogPanel`:

- Search across label / description / key / category
- Category sections with compact rows
- Human-readable label primary
- Copyable permission key secondary
- “Used by” role names
- Empty search state

## Shadcn note

Uses existing WILMS `Input`, `Badge`, and list layout. Full Radix/Shadcn Table/Tooltip adoption deferred to migration plan — no duplicate parallel card system introduced.
