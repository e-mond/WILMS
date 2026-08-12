# Executive Geo Analytics

**Product version:** 1.8.0  
**Language:** British English

## Required analytical cuts

| View | Source of truth |
|------|-----------------|
| Region totals | join via `borrowers.region_id` / pool region mapping |
| District totals | join via `borrowers.district_id` |
| Community totals | join via `borrowers.community_id` or `groups.community_id` |
| Collector by district | `collectors.assigned_district_id` |
| Portfolio by district | loans -> borrowers -> districts |
| Delinquency by district | risk/default metrics grouped by district |
| Constituency analytics | future extension; keep district/community as current grain |

## Implementation guidance

1. Prefer official names from the location master for exports and dashboards.
2. Keep text fallbacks during unresolved mapping.
3. Surface unresolved location counts in operations reviews.
4. Do not invent constituency geometry until a verified constituency dataset is adopted.
