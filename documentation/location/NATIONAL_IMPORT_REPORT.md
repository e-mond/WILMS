# National Import Report

**Product version:** 1.8.0 (unchanged)  
**Branch:** `feature/v1.8.0-national-locality-completion`  
**Dataset versions:** `imccod-2026-08-12` + `hotosm-2026-08-07`  
**Language:** British English

## Sources used

| Source | Licence / authority | What was imported |
|--------|---------------------|-------------------|
| IMCCOD MMDA register | Official public register | 16 regions, 261 MMDAs, 261 capital communities |
| STMA Assembly Members + sub-metro pages | Official municipal publication | 3 sub-metros, 36 electoral areas, STMA communities |
| HOTOSM Populated Places (HDX, 2026-08-07) | ODC-ODbL | **7,121** named places matched to IMCCOD MMDAs |
| Bundled `cities.json` | Existing seed (official + OSM-flagged) | Preserved where MMDA name matches |

## Import statistics (snapshot build)

| Metric | Count |
|--------|------:|
| HOTOSM features scanned | 31,589 |
| Named features imported | 7,121 |
| Skipped unnamed | 22,819 |
| Skipped unmatched `adm2_name` | 1,360 |
| Skipped duplicates within MMDA | 124 |
| Distinct MMDAs with HOTOSM communities | 220 |
| IMCCOD capitals | 261 |
| STMA hierarchy communities | 49 |

## Matching rules

1. Require a non-empty locality `name`.
2. Accept `place` in city / town / village / hamlet / suburb / neighbourhood, or named `landuse=residential`.
3. Match `adm2_name` to IMCCOD via `normaliseMatchKey`.
4. **Never** invent electoral-area or sub-district parents.
5. Store coordinates and `geometry_ref = hotosm:{osmId}` when present.

## Remaining gaps

- 41 MMDAs without HOTOSM name matches (still have IMCCOD capital communities).
- National Area / Zonal / Town / Urban councils outside STMA.
- National Electoral Commission electoral areas outside STMA.
- Official GSS locality file not yet licensed for machine import.

## Commands

```bash
npm run build:hotosm-communities -w @wilms/domain
npm run db:apply:national-locality -w @wilms/domain
npm run seed:ghana-hierarchy -w @wilms/domain
```
