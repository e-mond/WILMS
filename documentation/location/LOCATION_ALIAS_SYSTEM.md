# Location Alias System

**Product version:** 1.8.0  
**Language:** British English

## Storage

| Store | Purpose |
|-------|---------|
| `communities.aliases text[]` | Inline aliases shipped with community rows |
| `location_aliases` | Normalised alias index across entity types |

`location_aliases` columns: `entity_type`, `entity_id`, `alias`, `normalised_alias`, `source`, `dataset_version`.

## Resolution order

1. Exact case-insensitive match on canonical name  
2. Exact alias match  
3. Punctuation / whitespace / hyphen normalisation  
4. Fuzzy Dice bigram similarity (threshold configurable; default ≥ 0.72)

Implementation: `packages/domain/src/modules/locations/alias-resolution.ts`

## Supported variations

- Abbreviations and spacing (`Market  Circle`)
- Hyphen vs space (`Sekondi-Takoradi`)
- Historical / alternate spellings when present in source aliases (e.g. STMA `Bakaeyile`)
- English / local-language variants when present as `name_en` / `name_latin` on HOTOSM

## APIs

- Registration / borrower resolution uses alias-aware `resolveLocationIdsByNames`
- Autocomplete uses ranked search + offline candidate scoring
