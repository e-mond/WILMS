# Data Quality Report

**Product version:** 1.8.0  
**Status:** Pending live database run  
**Language:** British English

Run:

```bash
npm run validate:location-quality -w @wilms/domain
```

The validator writes this file with live counts for regions, MMDAs, communities, aliases, orphan foreign keys, invalid coordinates, duplicate aliases, and unresolved borrower / group / collector location rates.

Expected structural gaps (not failures):

- Sub-district units and electoral areas outside STMA
- Collectors without UUID territory until onboarded with the new selectors
