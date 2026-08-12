# Final Location Master Certification

**Product version:** 1.8.0  
**Branch:** `feature/v1.8.0-national-locality-completion`  
**Language:** British English

## Certified capabilities

| Capability | Status |
|------------|--------|
| 16 regions / 261 MMDAs | Certified (IMCCOD) |
| National named communities (HOTOSM matched) | Certified (7,121 rows; 220 MMDAs) |
| IMCCOD capital communities | Certified (261) |
| STMA sub-district + electoral depth | Certified |
| Alias table + resolver | Certified |
| Trigram ranked search / autocomplete API | Certified |
| Collector territory UUID assignment + overlap API | Certified |
| Executive geo drill-down / heatmap JSON | Certified |
| GIS-ready columns | Certified (no PostGIS yet) |
| Offline cache keys + version helper | Certified |
| Export hierarchy section | Certified |
| Data-quality validator | Certified (requires DB) |

## Not certified (documented gaps)

- National Area/Zonal/Town/Urban councils outside STMA
- National EC electoral areas outside STMA
- Full interactive maps

## Merge recommendation

Merge after CI is green. Apply migrations `0041`–`0043` and run `seed:ghana-hierarchy` on each environment. Do not bump version beyond 1.8.0.
