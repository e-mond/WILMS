# National Locality Test Report

**Product version:** 1.8.0  
**Branch:** `feature/v1.8.0-national-locality-completion`  
**Language:** British English

## Automated suites

| Suite | Command | Focus |
|-------|---------|-------|
| Hierarchy v2 | `npm run test -w @wilms/domain -- src/tests/locations` | IMCCOD/STMA integrity |
| National locality | same | Capitals, HOTOSM load, alias scoring, audit JSON |

## Manual / environment checks

1. Apply `0043` then `seed:ghana-hierarchy`
2. `GET /locations/autocomplete?q=Fij`
3. `GET /intelligence/geography/drilldown?level=region`
4. Collector onboard with region/MMDA/community
5. Offline: disconnect network and open registration cascade

## Performance expectations

| Operation | Target |
|-----------|--------|
| Autocomplete | < 100 ms after warm DB (trigram indexes) |
| National community volume | 7,000+ HOTOSM + capitals + STMA + bundle |

Benchmark results should be filled after staging seed.
