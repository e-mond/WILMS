# Ghana Locations Seed Manifest

## Sources

| Dataset | Source | Retrieved |
|---------|--------|-----------|
| Regions (16) | Ghana Statistical Service administrative regions | 2026-07-04 |
| Districts (48 sample MMDAs) | Ghana MMDA directory (representative subset per region) | 2026-07-04 |
| Cities/communities (144) | Official district seats + OpenStreetMap place names (flagged) | 2026-07-04 |

## Files

- `regions.json` — `{ code, name }` for all 16 official regions
- `districts.json` — `{ region_code, name, type, code }` where `type` is District | Municipal | Metropolitan
- `cities.json` — `{ district_code, name, source }` where `source` is `official` or `openstreetmap`

## Update workflow

1. Refresh JSON from official sources where available.
2. Run `npm run seed:ghana-locations` against staging, then production after migration `0012_ghana_locations.sql`.
3. Document gaps in this file rather than inventing community names.

## OSM fallback policy

When official community-level data is unavailable for a district, OSM-sourced place names are included with `"source": "openstreetmap"`. These should be reviewed before relying on them for compliance reporting.
