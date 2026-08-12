# National Coverage Audit

**Product version:** 1.8.0 (unchanged)  
**Branch:** `feature/v1.8.0-national-locality-completion`  
**Audit date:** 12 August 2026  
**Language:** British English  
**Method:** Static inspection of committed adapters, seed JSON, migrations, and APIs. No fabricated locality names.

Machine-readable companion: `data/ghana-locations/national-coverage-audit.json`

---

## 1. Scope

This audit describes **what is already in the repository and import pipeline** after migrations `0041_v180_location_master` and `0042_v180_ghana_admin_hierarchy`, before the national locality completion sprint expands community coverage.

It answers coverage for:

| Layer | Question |
|-------|----------|
| Region | Are all 16 official regions present? |
| MMDA | Are all 261 MMDAs present? |
| Sub-district unit | Which MMDAs have Area / Zonal / Town / Urban / Sub-Metro councils? |
| Electoral area | Which MMDAs have electoral areas? |
| Community | How many communities exist, from which sources, and with what parent linkage? |
| Alias | Where aliases exist today |
| Operational gaps | Borrower, group, collector, report, offline, search |

---

## 2. Authoritative sources used in the current pipeline

| Source | Role in WILMS | Verified count |
|--------|---------------|----------------|
| Official region list (`GHANA_REGIONS`) | Regions | **16** |
| [IMCCOD MMDA register](https://imccod.gov.gh/mmdas/) transcribed to `scripts/location-sync/datasets/imccod-mmdas.tsv` | MMDAs + capitals | **261** |
| [STMA Assembly Members](https://stma.gov.gh/assembly-members.php) + STMA sub-metro pages | Sub-metros, electoral areas, STMA communities | **3** sub-metros, **36** electoral areas, **49** STMA community rows (36 EA labels + 13 neighbourhoods) |
| Bundled `data/ghana-locations/*.json` | Offline / no-DB fallback and preserved community seed | **16** regions, **48** districts, **144** cities |
| geoBoundaries GHA ADM1 / ADM2 API | Polygon readiness metadata only (not loaded as operational names) | ADM1 **16**, ADM2 **260** (one MMDA behind IMCCOD) |
| HOTOSM Populated Places (HDX, snapshot `2026-08-07`) | Candidate national community import (named features only) | Metadata: **31,589** features; **~7,770** distinct named localities after null names |

Sources **not** yet licensed or transcribed into the pipeline:

- National Local Government Service Area / Zonal / Town / Urban Council gazetteer (outside STMA)
- National Electoral Commission electoral-area file for all 261 MMDAs
- Official Ghana Statistical Service locality file for every MMDA
- PostGIS boundary polygons (columns prepared; polygons not loaded)

---

## 3. Hierarchy coverage summary

| Level | Target | Current import snapshot | Coverage status |
|-------|-------:|------------------------:|-----------------|
| Country | 1 (implicit) | Implicit Ghana | Complete |
| Region | 16 | 16 | **Complete** |
| MMDA (`districts`) | 261 | 261 (IMCCOD) | **Complete** |
| Sub-district unit | National gazetteer | 3 (STMA only) | **Partial — 1 / 261 MMDAs** |
| Electoral area | National EC file | 36 (STMA only) | **Partial — 1 / 261 MMDAs** |
| Community | All available official + licensed OSM named places | STMA 49 + bundled 144 (with overlap risk on STMA) | **Partial** |
| Street / landmark | Free text | Borrower / group address fields | Complete (free text) |

### 3.1 Regions (complete)

All 16 regions are present with stable codes: GAR, ASH, WES, CEN, EAS, NOR, VOL, UPE, UPW, BON, BEA, AHA, WNO, OTI, NEE, SAV.

### 3.2 MMDAs by region (complete — IMCCOD)

| Region code | MMDA count |
|-------------|----------:|
| AHA | 6 |
| ASH | 43 |
| BON | 12 |
| BEA | 11 |
| CEN | 22 |
| EAS | 33 |
| GAR | 29 |
| NEE | 6 |
| NOR | 16 |
| OTI | 9 |
| SAV | 7 |
| UPE | 15 |
| UPW | 11 |
| VOL | 18 |
| WES | 14 |
| WNO | 9 |
| **Total** | **261** |

Bundled `districts.json` still holds only **48** sample MMDAs for offline fallback when the database is empty. That is a **fallback gap**, not an IMCCOD gap.

### 3.3 Sub-district units (STMA only)

| MMDA | Units | Unit type |
|------|------:|-----------|
| Sekondi Takoradi Metropolitan (`imccod:243`) | 3 | Sub-Metro Council |

**Missing:** Area Councils, Zonal Councils, Town Councils, and Urban Councils for the other **260** MMDAs. Empty cascade levels are intentional until a national gazetteer is licensed.

### 3.4 Electoral areas (STMA only)

| MMDA | Electoral areas | Source |
|------|----------------:|--------|
| Sekondi Takoradi Metropolitan | 36 | STMA Assembly Members page |

**Missing:** Electoral areas for **260** MMDAs. Communities outside STMA must keep `electoral_area_id = NULL` until an EC dataset is adopted.

### 3.5 Communities

| Source class | Count in seed / adapter | Parent linkage | Coordinates |
|--------------|------------------------:|----------------|-------------|
| STMA electoral-area labels as communities | 36 | Linked to STMA electoral areas | None |
| STMA neighbourhoods named on sub-metro pages | 13 | Linked where documented | None |
| Bundled `cities.json` | 144 (48 official district seats + 96 OSM-flagged) | Mapped onto IMCCOD MMDAs by name when possible; unmapped rows skipped | None |
| IMCCOD capitals (as community candidates) | 261 names on TSV | Not yet imported as community rows before this sprint | None |
| HOTOSM named populated places | Candidate national expansion | Match to MMDA via `adm2_name`; **no** electoral-area inventing | Available on features |

Bundled city name uniqueness: **144** unique names; **0** duplicate names within the bundle. Every bundled district has at least one city.

**Names deliberately not imported** (not on reviewed STMA pages): European Town; Old Sekondi / Town Centre.

### 3.6 Alias coverage

| Entity | Alias storage today | Coverage |
|--------|---------------------|----------|
| Communities | `communities.aliases text[]` | STMA aliases only (e.g. Bakaeyile, Railway & Habour, Sekondi Ridge) |
| Regions / MMDAs / sub-units / electoral areas | Name column only | No dedicated alias table before this sprint |
| Resolution | Exact case-insensitive name match in `resolveLocationIdsByNames` | No fuzzy / punctuation / alias engine before this sprint |

---

## 4. Duplicate and integrity risks

| Risk | Finding |
|------|---------|
| Duplicate locality names across MMDAs | Expected nationally (same village name in multiple districts). Uniqueness is scoped to `(district_id, name)` and `(electoral_area_id, name)` where set. |
| STMA community overlap with bundled cities | Possible name collisions on import; upsert key is `(source, source_id)`, so STMA and bundled rows remain distinct sources. |
| geoBoundaries ADM2 vs IMCCOD | geoBoundaries reports **260** ADM2 units; IMCCOD has **261**. Polygon join must use name normalisation, not assume 1:1 serial identity. |
| Orphan electoral areas | None in STMA seed: all 36 reference `imccod:243`. |
| Circular hierarchy | Schema is strict parent FKs; no cycle possible without bad seed data. |

---

## 5. Operational location gaps

| Surface | Current state | Gap |
|---------|---------------|-----|
| Borrower registration cascade | Region → MMDA → optional sub-unit → optional electoral area → community | Works; empty levels skip. National communities still sparse outside STMA + bundle. |
| Borrower / group UUID FKs | `region_id`, `district_id`, `sub_district_unit_id`, `electoral_area_id`, `community_id` | Text fallbacks remain; unresolved UUID rates depend on live DB backfill. |
| Collector territory | Schema supports Region → Community UUID assignment; onboard API accepts deeper IDs | UI onboard modal still only captures free-text zone; no overlap / workload / density analytics yet. |
| Executive dashboard filters | Query params accept region / district / sub-unit / electoral area / community | Filters are acknowledged in the response but portfolio drill-down and heat-map datasets are not fully computed yet. |
| Search / autocomplete | `ILIKE` + alias `unnest`; `pg_trgm` indexes exist | No similarity ranking, no unified ranked result list, no dedicated frontend autocomplete control. |
| Offline cache | Regions, districts, communities, sub-units, electoral areas | No alias index cache, no version-aware invalidation beyond snapshot timestamps, no search index blob. |
| Exports | Dashboard / intelligence exports | Geographic hierarchy columns and territory filters not consistently applied to PDF / Word / Excel / CSV. |
| GIS | `latitude`, `longitude`, `geometry_ref` on communities | No region/MMDA geometry refs; PostGIS not enabled. |

---

## 6. Search and offline readiness

| Capability | Status |
|------------|--------|
| `pg_trgm` extension + GIN indexes on name columns | Present in `0042` |
| Alias-aware community search | Present (`ILIKE` on name or any alias) |
| Similarity ranking / typo tolerance | **Missing** |
| Prefix-first ranking | **Missing** |
| Offline full-hierarchy search | Partial (cascade caches only) |
| Sub-100 ms autocomplete target | Requires ranked SQL + limited payload; not yet measured on national volume |

---

## 7. Coverage gap register (actionable)

| ID | Gap | Severity | Planned remediation in this sprint |
|----|-----|----------|------------------------------------|
| G1 | Sub-district units outside STMA | High for municipal ops | Document gap; keep skippable cascade; do **not** invent councils |
| G2 | Electoral areas outside STMA | High for constituency ops | Same as G1; await EC dataset |
| G3 | National communities sparse | High | Import IMCCOD capitals + HOTOSM **named** places matched to IMCCOD MMDAs |
| G4 | Alias engine incomplete | Medium | Dedicated alias table + resolver (exact / alias / normalised / fuzzy) |
| G5 | Fuzzy autocomplete incomplete | Medium | Trigram ranked search API + accessible frontend control |
| G6 | Collector territory UI / intelligence | Medium | Cascading assignment + territory summary APIs |
| G7 | Executive geo drill-down / heat maps | Medium | Hierarchy aggregate endpoints + heat-map JSON (no map UI yet) |
| G8 | GIS polygon load | Low this sprint | Store boundary identifiers / readiness docs; no PostGIS enablement |
| G9 | Offline alias + search index | Medium | Extend IndexedDB snapshots + version invalidation |
| G10 | Export geographic filters | Medium | Add official hierarchy fields and territory filters |
| G11 | Bundled offline districts = 48 | Medium | Prefer DB master when online; keep bundle as last-resort fallback |
| G12 | Data-quality automation | Medium | Validation script + `DATA_QUALITY_REPORT.md` |

---

## 8. Definition of “complete available national locality hierarchy”

For this product, **complete available** means:

1. **100%** of Regions and MMDAs from the IMCCOD register.
2. **All licensed, named community / settlement features** that can be matched to an IMCCOD MMDA without inventing parents.
3. **STMA** sub-district and electoral depth where officially published.
4. **Explicit empty** deeper levels elsewhere (skip in UI) rather than fabricated Area Councils or electoral areas.
5. Street / landmark remain free text.

Anything beyond that requires a new licensed gazetteer and a follow-on import with its own dataset version.

---

## 9. Phase gate

Phase 1 is **complete**. Phase 2 may proceed using only verifiable sources listed above, recording import statistics and remaining gaps in `NATIONAL_IMPORT_REPORT.md`.
