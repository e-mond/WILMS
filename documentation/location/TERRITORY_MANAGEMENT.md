# Territory Management

**Product version:** 1.8.0  
**Language:** British English

Collectors can be assigned at any depth:

| Column | Level |
|--------|-------|
| `assigned_region_id` | Region |
| `assigned_district_id` | MMDA |
| `assigned_sub_district_unit_id` | Sub-metro / Area / Zonal / Town / Urban Council |
| `assigned_electoral_area_id` | Electoral area |
| `assigned_community_id` | Community |

Text `assigned_region` / `assigned_district` / `zone` remain for display and historical rows.

Future work (schema already supports the keys):

- Workload balancing
- Territory overlap detection
- Route optimisation
- Coverage analytics
