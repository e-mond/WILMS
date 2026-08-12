# Offline Location Strategy

**Product version:** 1.8.0  
**Language:** British English

## Goal

Once the location hierarchy has been cached on a device, registration must continue offline without depending on third-party APIs.

## Cache model

IndexedDB store: `wilms-offline-cache`

Keys:

- `location-regions`
- `location-districts:{regionId}`
- `location-sub-district-units:{districtId}`
- `location-electoral-areas:{parentId}`
- `location-communities:{districtId}`
- `location-communities:ea:{electoralAreaId}`
- `location-hierarchy`

Empty sub-district or electoral-area lists are cached as empty arrays so the cascade can skip offline.

## Runtime behaviour

1. Online reads hydrate IndexedDB after successful API responses.
2. Offline or failed reads fall back to IndexedDB.
3. If no cache exists, the app may fall back to bundled seed data.
4. Community suggestions require connectivity because they create reviewable server records.

## Sync when online returns

When connectivity returns:

1. refresh regions
2. refresh districts for recently used regions
3. refresh sub-district units and electoral areas for recently used districts
4. refresh communities for recently used districts and electoral areas
5. compare against `GET /locations/sync/status` dataset version when available
