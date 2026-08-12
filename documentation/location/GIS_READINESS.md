# GIS Readiness

**Product version:** 1.8.0  
**Language:** British English

WILMS is prepared for mapping integrations without enabling PostGIS in this sprint.

## Stored spatial fields

| Table | Fields |
|-------|--------|
| `regions` | `latitude`, `longitude`, `geometry_ref` |
| `districts` | `latitude`, `longitude`, `geometry_ref` |
| `sub_district_units` | `latitude`, `longitude`, `geometry_ref` |
| `electoral_areas` | `latitude`, `longitude`, `geometry_ref` |
| `communities` | `latitude`, `longitude`, `geometry_ref` |

HOTOSM imports populate community coordinates and `geometry_ref = hotosm:{osmId}`.

## Designed for

- PostGIS `geography(MultiPolygon, 4326)` later join via `geometry_ref`
- Leaflet / Mapbox / OpenLayers clients reading heatmap JSON
- Route optimisation and spatial clustering on community points
- Executive heat-map dataset: `GET /intelligence/geography/heatmap`

## Explicitly not built yet

Full interactive maps, tile layers, and PostGIS extension enablement on Neon.
