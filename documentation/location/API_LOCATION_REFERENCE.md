# API Location Reference

**Product version:** 1.8.0  
**Language:** British English  
**Base path:** `/api/v1`

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/locations/regions` | Public | List active regions |
| GET | `/locations/regions/:id/districts` | Public | List districts for a region |
| GET | `/locations/districts/:id/communities` | Public | List communities for a district |
| GET | `/locations/districts/:id/cities` | Public | Compatibility alias for communities |
| GET | `/locations/search?q=` | Public | Search regions, districts, communities |
| POST | `/locations/community-suggestions` | Auth | Submit a pending community suggestion |
| GET | `/locations/sync/status` | Auth + elevated | Latest import metadata |
| GET | `/locations/current` | Auth | Device/location placeholder for GPS helpers |

## Response envelope

```json
{
  "data": {
    "meta": {
      "version": "2026-07-04",
      "source": "geoBoundaries",
      "lastUpdated": "2026-08-12T10:00:00.000Z"
    },
    "data": []
  }
}
```

Caching headers:

- hierarchy reads: `Cache-Control: public, max-age=300, stale-while-revalidate=3600`
- search: `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- sync status: `Cache-Control: no-store`
