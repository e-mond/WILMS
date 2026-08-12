# Executive Geo Analytics

**Product version:** 1.8.0  
**Language:** British English

## Required analytical cuts

| View | Source of truth |
|------|-----------------|
| Region totals | join via `borrowers.region_id` / pool region mapping |
| MMDA totals | join via `borrowers.district_id` |
| Sub-district totals | join via `borrowers.sub_district_unit_id` |
| Electoral area / constituency | join via `borrowers.electoral_area_id` |
| Community totals | join via `borrowers.community_id` or `groups.community_id` |
| Collector by territory | collector assigned_* UUID columns |
| Portfolio / delinquency heat maps | loans → borrowers → location master; polygons deferred to GIS preparation |

## Implementation guidance

1. Prefer official names from the location master for exports and dashboards.
2. Keep text fallbacks during unresolved mapping.
3. Surface unresolved location counts in operations reviews.
4. Do not invent constituency geometry until a verified constituency dataset is adopted.
