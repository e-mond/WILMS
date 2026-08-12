# Migration Strategy — Hierarchy v2

**Product version:** 1.8.0  
**Language:** British English

1. Apply `0041_v180_location_master` if not already present.
2. Apply additive `0042_v180_ghana_admin_hierarchy` (`CREATE TABLE`, `ADD COLUMN`, indexes, `pg_trgm`).
3. Import IMCCOD 261 MMDAs, matching existing districts by normalised name so UUIDs are preserved.
4. Import STMA sub-metros, electoral areas, and verified communities.
5. Re-upsert bundled `cities.json` communities onto matched MMDAs.
6. Backfill borrower / group / collector UUIDs with `db:backfill:locations` (text match; no deletes).
7. Verify APIs, registration cascade, and offline cache keys.

Rollback: drop the new tables and columns only. v1 location tables and text fields are untouched.
