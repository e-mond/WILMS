# Ghana Hierarchy Test Report

**Product version:** 1.8.0  
**Language:** British English

## Automated

| Suite | Command | Scope |
|-------|---------|-------|
| Hierarchy snapshot | `npx vitest run src/tests/locations/hierarchy-v2.test.ts` | 16 regions, 261 MMDAs, STMA depth, no unsourced names |
| Full domain suite | `npx vitest run` in `@wilms/domain` | **91 files, 287 tests passed** (12 August 2026) |
| Location identifiers | `src/tests/locations/location-master.test.ts` | Stable UUIDs |
| Reconciliation regression | `src/tests/reconciliation/service.test.ts` | CI mock for `getDb` |

## Manual / operational

| Check | Expected |
|-------|----------|
| Migration `0042` | Additive; `pg_trgm` indexes created |
| Registration cascade | STMA shows sub-metros and electoral areas; other MMDAs skip empty levels |
| Suggestion | Creates `PENDING` row; does not insert `communities` |
| Offline | IndexedDB keys for sub-units and electoral areas |
| Reports | Executive dashboard accepts `region`, `subDistrictUnit`, `electoralArea` filters |

Performance targets after import: autocomplete and cascade lists remain bounded by parent id; search uses `limit` plus trigram indexes.
