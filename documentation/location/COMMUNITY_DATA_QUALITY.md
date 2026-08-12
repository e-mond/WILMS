# Community Data Quality

**Product version:** 1.8.0  
**Language:** British English

## Automated checks

Run:

```bash
npm run validate:location-quality -w @wilms/domain
```

| Check | Fail on > 0? |
|-------|:------------:|
| Orphan districts (missing region) | yes |
| Orphan communities (missing MMDA) | yes |
| Community electoral-area FK broken | yes |
| Invalid latitude / longitude | yes |
| Duplicate aliases (same entity + normalised alias) | yes |
| Borrowers linked to missing communities | yes |
| Groups linked to missing communities | yes |
| Duplicate community names within one MMDA | report only |
| Borrowers/groups without UUID location links | report only |

## Reports

- Live run output: `documentation/location/COMMUNITY_DATA_QUALITY_REPORT.md`
- Historical runs stored in `location_data_quality_runs`

## Operator guidance

1. Never delete communities that borrowers or groups still reference.
2. Prefer alias rows over renaming official source spellings.
3. Use the suggestion workflow for genuinely missing localities.
4. Same display name in different MMDAs is valid (for example Zongo).
