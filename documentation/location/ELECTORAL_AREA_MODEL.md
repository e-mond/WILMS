# Electoral Area Model

**Product version:** 1.8.0  
**Language:** British English

An electoral area is the elected Assembly Member constituency inside an MMDA.

| Column | Notes |
|--------|-------|
| `district_id` | Always set |
| `sub_district_unit_id` | Nullable when the parent sub-structure is unknown |
| Unique `(district_id, name)` | Prevents duplicate labels inside one MMDA |

STMA contributes 36 electoral areas from the Assembly Members register. National Electoral Commission lists are not imported until a redistributable extract is available.
