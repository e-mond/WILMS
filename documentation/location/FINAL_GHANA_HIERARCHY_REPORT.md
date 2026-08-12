# Final Ghana Hierarchy Report

**Product version:** 1.8.0 (unchanged)  
**Branch:** `feature/v1.8.0-ghana-admin-hierarchy-v2`  
**Language:** British English

## What shipped

- Additive migration `0042_v180_ghana_admin_hierarchy`
- Source-agnostic adapters under `scripts/location-sync/`
- 16 regions and 261 MMDAs from IMCCOD
- STMA: 3 sub-metros, 36 electoral areas, verified communities
- Registration cascade with skip rules
- Location APIs for every hierarchy level
- Collector territory UUID columns through community
- Offline cache keys for the new levels
- Documentation set listed in `DOCUMENTATION_LIBRARY_INDEX.md`

## Tests

`@wilms/domain` vitest: **91 files, 287 passed**.

Type-check: `@wilms/domain` and `@wilms/frontend` `tsc --noEmit` passed.

- National Area / Zonal / Town / Urban Council gazetteer
- National Electoral Commission electoral-area file
- GSS locality file for all 261 MMDAs
- PostGIS polygons (prepared, not loaded)

## Merge recommendation

Merge after CI is green on this branch. Apply `0042` then `seed:ghana-hierarchy` on each environment. Do not delete v1 location rows.
