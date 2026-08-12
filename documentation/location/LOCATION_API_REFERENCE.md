# Location API Reference

**Product version:** 1.8.0  
**Language:** British English  
**Base path:** `/api/v1`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/locations/regions` | Public | Cache 5 minutes |
| GET | `/locations/regions/:id/districts` | Public | MMDAs for a region |
| GET | `/locations/districts/:id/sub-district-units` | Public | Empty array is a valid skip |
| GET | `/locations/districts/:id/electoral-areas` | Public | Used when sub-units are absent |
| GET | `/locations/sub-district-units/:id/electoral-areas` | Public | Cascade after sub-unit |
| GET | `/locations/districts/:id/communities` | Public | Compatibility + skip path |
| GET | `/locations/electoral-areas/:id/communities` | Public | Preferred community list |
| GET | `/locations/search?q=` | Public | Name and alias `ilike`; cache 60 seconds |
| POST | `/locations/community-suggestions` | Auth | `{ districtId?, electoralAreaId?, proposedName }` |
| GET | `/locations/sync/status` | Auth + reports/admin | Latest import log |

Every collection response includes `meta.version`, `meta.source`, and `meta.lastUpdated`.
