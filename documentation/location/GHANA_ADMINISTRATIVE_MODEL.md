# Ghana Administrative Model

**Product version:** 1.8.0  
**Language:** British English

## Canonical stack

```mermaid
flowchart TD
  C[Country: Ghana]
  R[Region]
  M[MMDA / districts]
  S[sub_district_units]
  E[electoral_areas]
  L[communities]
  T[Street / landmark free text]
  C --> R --> M --> S --> E --> L --> T
```

All master tables use UUID primary keys, provenance (`source`, `source_id`, `dataset_version`), and `is_active`.

Skip behaviour:

- No sub-district units → continue to electoral areas or communities.
- No electoral areas → continue to district communities.
- No community match → suggestion queue (Super Admin approval only).

Street and landmark remain free text on the borrower profile (`houseAddress`).
