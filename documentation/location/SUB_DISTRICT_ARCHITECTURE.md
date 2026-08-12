# Sub-District Architecture

**Product version:** 1.8.0  
**Language:** British English

`sub_district_units` is a polymorphic table. `unit_type` is one of:

| unit_type | Typical parent |
|-----------|----------------|
| Sub-Metro Council | Metropolitan assembly |
| Area Council | Municipal / District assembly |
| Zonal Council | Municipal / District assembly |
| Town Council | Municipal / District assembly |
| Urban Council | Municipal / District assembly |

This sprint imports only the three verified STMA Sub-Metropolitan District Councils. Other MMDAs have zero rows so the registration cascade skips the level. A future GSS or Local Government Service gazetteer can fill the table without a schema change.
