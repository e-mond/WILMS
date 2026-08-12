# Location Sync Guide

**Product version:** 1.8.0  
**Language:** British English

## Commands

```bash
npm run db:migrate -w @wilms/domain
npm run seed:location-master -w @wilms/domain
npm run db:backfill:locations -w @wilms/domain
```

Optional environment:

```bash
WILMS_LOCATION_DATASET_SOURCE=geoBoundaries
WILMS_LOCATION_DATASET_VERSION=2026-07-04
```

## Import behaviour

1. Read verified seed JSON under `data/ghana-locations/`.
2. Generate stable UUIDs from `source + source_id`.
3. Upsert regions, districts, and communities by provenance key.
4. Write a `location_sync_log` row with counts and status.

## Re-import safety

Re-running the importer must not fork identities. Conflict targets are `(source, source_id)`.

## Validation checklist

- region count matches expected dataset version
- every district resolves to a region
- every community resolves to a district
- sync status endpoint reports the latest successful import
- unresolved borrower/group mappings are reviewed after backfill
