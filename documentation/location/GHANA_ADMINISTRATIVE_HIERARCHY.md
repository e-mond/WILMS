# Ghana Administrative Hierarchy

**Product version:** 1.8.0  
**Language:** British English

## Official structure used by WILMS

| Level | WILMS entity | Notes |
|-------|--------------|-------|
| Country | implied | Ghana |
| Region | `regions` | All 16 Ghana regions |
| Metropolitan / Municipal / District Assembly | `districts` | 261 MMDAs; `category` is Metropolitan, Municipal, or District |
| Sub-metro / Area / Zonal / Town / Urban Council | `sub_district_units` | Polymorphic `unit_type`; skip when empty |
| Electoral area | `electoral_areas` | Assembly Member constituency; skip when empty |
| Community / suburb / neighbourhood | `communities` | Suggestion workflow; never auto-created |
| Street / landmark | borrower `houseAddress` | Free text only |

## Source policy

Preferred order:

1. Ghana Statistical Service administrative dataset
2. Local Government Service / IMCCOD MMDA register
3. Electoral Commission and assembly registers for electoral areas
4. GADM / geoBoundaries / OSM for geometry only

Application logic never hardcodes a single vendor. Adapters live in `scripts/location-sync/`.

## Compatibility aliases

| Legacy term | Canonical term |
|-------------|----------------|
| City | Community |
| MMDA | District |
| Zone / branch free text | Collector territory fields mapped to hierarchy UUIDs when possible |
