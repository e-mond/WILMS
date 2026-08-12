# Community Import Report

**Product version:** 1.8.0  
**Sprint:** Community-level location completion  
**Language:** British English

## Sources used (verified only)

| Priority | Source | Use in this sprint |
|---------:|--------|--------------------|
| 1 | Ghana Statistical Service (when licensed) | Adapter slot; not fabricated |
| 2 | IMCCOD MMDA register + capitals | 16 regions, 261 MMDAs, capital communities |
| 3 | STMA official publications / sub-metro pages | Sub-metros, electoral areas, verified neighbourhoods |
| 4 | HOTOSM Ghana populated places (OpenStreetMap extract) | Named communities / suburbs / villages matched to MMDAs |
| 5 | Bundled `cities.json` | Preserved as fallback rows; never invented |

No community names were fabricated. Official spelling is preserved from the source record.

## Import pipeline

```text
build:hotosm-communities
        ↓
hotosm-communities.json (dataset version + source metadata)
        ↓
seed:ghana-hierarchy (idempotent upserts)
        ↓
location_sync_log (+ aliases_imported)
```

Commands:

```bash
npm run build:hotosm-communities -w @wilms/domain
npm run db:apply:community-location -w @wilms/domain
npm run seed:ghana-hierarchy -w @wilms/domain
```

## Statistics (dataset build + live seed, 2026-08-12)

| Metric | Value |
|--------|------:|
| HOTOSM GeoJSON features scanned | 31,589 |
| HOTOSM communities in compact JSON | 7,130 |
| Distinct MMDAs with HOTOSM communities | 221 |
| HOTOSM newly inserted on live seed | 6,188 |
| HOTOSM merged into existing district+name | 942 |
| Verified snapshot communities (IMCCOD + STMA) | 313 |
| Communities in DB after seed | 7,414 |
| Migration | `0043_v180_community_location_completion` |

## Idempotency and safety

| Guarantee | Mechanism |
|-----------|-----------|
| Stable region/MMDA UUIDs | Snapshot `source` remains `imccod+stma` |
| Stable HOTOSM community UUIDs | Separate `source = hotosm` + stable `sourceId` |
| Re-import safe | `ON CONFLICT` upserts on `(source, source_id)` |
| Deduplication | Match-key normalisation; duplicate HOTOSM rows skipped at build |
| No invented electoral parents | HOTOSM communities set `electoral_area_id = null` |
| Alias table | Upserted with unique `(entity_type, entity_id, normalised_alias)` |

## MMDA name matching fix

HOTOSM often labels metropolitan assemblies as “Metropolis”. IMCCOD uses “Metropolitan”.  
`normaliseMatchKey` now strips `metropolis` / `metro` as well as `metropolitan`, which restored Sekondi/Takoradi matching.

## Metadata preserved

Each community row stores:

- `source`
- `source_id`
- `dataset_version`
- optional `latitude` / `longitude` / `geometry_ref` when supplied by HOTOSM
- `aliases` array plus normalised rows in `location_aliases`

## Out of scope (intentionally not imported)

- Boundary polygons / PostGIS
- National electoral-area gazetteer beyond STMA
- AI-generated or guessed neighbourhood names
