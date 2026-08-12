# GIS Preparation

**Product version:** 1.8.0  
**Language:** British English

WILMS is PostGIS-ready but does not enable PostGIS in this sprint.

| Field | Table | Use |
|-------|-------|-----|
| `latitude` / `longitude` | `communities` | Point placement |
| `geometry_ref` | `communities` | External polygon id (geoBoundaries GID, OSM relation, GSS code) |

Recommended next steps:

1. Enable `postgis` on Neon when boundary polygons are licensed.
2. Add `geometry` columns (`geography(MultiPolygon, 4326)`) on regions, districts, and sub-district units.
3. Keep `geometry_ref` as the stable join key so heat maps and route optimisation can land without renaming operational FKs.
