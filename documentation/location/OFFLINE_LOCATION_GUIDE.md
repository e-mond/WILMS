# Offline Location Guide

**Product version:** 1.8.0  
**Language:** British English

## Cached artefacts

| Key | Content |
|-----|---------|
| `location-regions` | Regions |
| `location-districts:{id}` | MMDAs for a region |
| `location-communities:{id}` | Communities for an MMDA / electoral area |
| `location-sub-district-units:{id}` | Sub-district units |
| `location-electoral-areas:{id}` | Electoral areas |
| `location-hierarchy` | Compact hierarchy snapshot |
| `location-search-index` | Flat search entries |
| `location-dataset-version` | Version for invalidation |

## Behaviour

- Registration cascade prefers network, falls back to IndexedDB, then bundled JSON.
- Search / autocomplete fall back to cached hierarchy when offline.
- `invalidateLocationCacheIfStale(version)` compares dataset versions after sync.

## Performance notes

National HOTOSM volume should be synced selectively per MMDA for field devices; full national dump size should be measured per environment after `seed:ghana-hierarchy`.
