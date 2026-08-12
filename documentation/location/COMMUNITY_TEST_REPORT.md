# Community Test Report

**Product version:** 1.8.0  
**Language:** British English  
**Branch:** `feature/v1.8.0-community-location-completion`

## Commands executed

| Command | Result |
|---------|--------|
| `npm run type-check` | Passed |
| `npm run lint` | Passed |
| `npm run test` (frontend) | Passed — 97 + 96 files / 277 + 272 tests |
| `npm run test -w @wilms/domain` | Passed after hierarchy-v2 expectation update (European Town now verified) |
| `npm run test -w @wilms/domain -- src/tests/locations` | Passed — 10 tests |
| `npm run build` | Passed |
| `npm run db:apply:community-location -w @wilms/domain` | Passed |
| `npm run seed:ghana-hierarchy -w @wilms/domain` | Passed (batched upserts) |
| `npm run validate:location-quality -w @wilms/domain` | Passed |

## Automated coverage

| Layer | Evidence |
|-------|----------|
| Dataset / import | `community-location-completion.test.ts`, `hierarchy-v2.test.ts` |
| Alias / fuzzy search | Alias normalisation + ranking unit tests |
| Frontend autocomplete | `LocationAutocomplete.test.tsx`, mock autocomplete filter test |
| Registration | Wizard wired to `LocationAutocomplete` + suggestion workflow |
| Data quality | Live `COMMUNITY_DATA_QUALITY_REPORT.md` — PASSED |

## Live import outcome (dev database)

| Metric | Value |
|--------|------:|
| HOTOSM newly imported | 6,188 |
| HOTOSM merged into existing names | 942 |
| Communities after seed | 7,414 |
| Aliases | 813 |
| Integrity failures | 0 |
