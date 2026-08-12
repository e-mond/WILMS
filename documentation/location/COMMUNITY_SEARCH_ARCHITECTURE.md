# Community Search Architecture

**Product version:** 1.8.0  
**Language:** British English

## Goals

Fast, offline-compatible community autocomplete without external search services.

## Components

```text
UI LocationAutocomplete
        │
        ├─ localOptions (IndexedDB / cascade payload)  ← offline first
        │
        └─ GET /locations/autocomplete?q=&types=community&districtId=
                 │
                 ├─ bundled fallback (no DATABASE_URL)
                 └─ PostgreSQL ranked search
                        ├─ ILIKE / prefix (`%` and trigram `%` operator)
                        ├─ community.aliases unnest
                        ├─ location_aliases (seeded)
                        └─ similarity() ranking (pg_trgm)
```

## Capabilities

| Capability | Implementation |
|------------|----------------|
| Fast autocomplete | Debounced 180 ms client calls; server limit capped at 40 |
| Prefix search | `ILIKE` + trigram prefix operator |
| Alias search | Array aliases + `location_aliases.normalised_alias` |
| Case-insensitive | SQL `ILIKE` / normalised query helpers |
| Typo tolerance | `similarity()` ranking via `pg_trgm` |
| Keyboard navigation | Arrow keys, Enter, Escape on combobox |
| Mobile-friendly | Full-width listbox; large tap targets |
| Offline-compatible | Local cascade options + cached hierarchy search fallback |
| District scoping | Optional `districtId` query parameter |

## Indexes

- `communities.name` trigram (from location master migrations)
- `location_aliases.normalised_alias` btree + gin_trgm_ops (0043)

## API

`GET /api/v1/locations/autocomplete?q=Nkonto&types=community&districtId=<uuid>&limit=12`

Also retains `GET /locations/search` for structured multi-entity results.
