# WILMS v1.8.0 — Ghana Holiday Provider Report

## Delivered

- Curated Ghana statutory holiday provider (`ghana-provider.ts`)
- Easter / Good Friday / Easter Monday computation
- Farmers’ Day = first Friday of December
- Curated Eid dates for 2025–2028
- Migration `0037` adds `source`, `enabled`, `year`, `external_key`
- `POST /organization-holidays/sync-ghana` + auto-ensure on list
- Settings → Holidays sync button

## Behaviour

Idempotent upsert by `external_key`. Manual holidays are not overwritten.
