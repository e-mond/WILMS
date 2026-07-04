# Ghana Locations

WILMS stores Ghana administrative hierarchy in PostgreSQL and ships bundled seed JSON for offline/demo fallback.

## Schema

- `ghana_regions(id, name, code, created_at, updated_at)`
- `ghana_districts(id, region_id, name, type, code, created_at, updated_at)` — unique `(region_id, name)`
- `ghana_cities(id, district_id, name, source, created_at, updated_at)` — unique `(district_id, name)`

Migration: `apps/backend/src/db/migrations/0012_ghana_locations.sql`

## Seed data

Bundled at `data/ghana-locations/` with manifest in `MANIFEST.md`.

## Import

```bash
npm run seed:ghana-locations
```

Requires `DATABASE_URL`. Validates JSON, upserts regions → districts → cities, and prints import stats.

## API

- `GET /locations/regions`
- `GET /locations/regions/:id/districts`
- `GET /locations/districts/:id/cities`
- `GET /locations/search?q=`

When the database is empty or unavailable, the API serves bundled JSON via `apps/backend/src/lib/ghana-locations.ts`.

## Registration form

`BorrowerRegistrationWizard` loads regions, then districts, then cities with child selects disabled until a parent is chosen.
