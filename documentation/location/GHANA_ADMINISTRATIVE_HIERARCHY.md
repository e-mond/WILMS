# Ghana Administrative Hierarchy

**Product version:** 1.8.0  
**Language:** British English

## Official structure used by WILMS

| Level | WILMS entity | Notes |
|-------|--------------|-------|
| Region | `regions` | All 16 Ghana regions |
| Metropolitan / Municipal / District Assembly | `districts` | Stored with `category` |
| Locality / community | `communities` | Replaces the previous `cities` concept |

## Source policy

Preferred order:

1. Ghana Statistical Service administrative dataset
2. GADM
3. geoBoundaries

Current initial import adapter uses the verified bundled seed plus provenance fields so a later GSS/geoBoundaries/GADM swap can be performed without changing API contracts.

## Naming conventions

- Prefer official spelling from the active dataset version.
- Keep aliases for historical or local names.
- Do not invent communities during registration.

## Compatibility aliases

| Legacy term | Canonical term |
|-------------|----------------|
| City | Community |
| MMDA | District |
| Zone / branch free text | Collector territory fields mapped to region/district/community when possible |
