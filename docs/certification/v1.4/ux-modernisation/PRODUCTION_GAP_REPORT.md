# Production Gap Report — v1.4 UX Modernisation

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Software vs operator gaps

| Gap | Type | Status |
|-----|------|--------|
| Live Super Admin smoke credentials | Operator | Open (see cutover pack) |
| Postgres `DATABASE_URL` for restore drill | Operator | Open |
| Production certification certificate | Process | **NOT ISSUED** |
| Full Shadcn migration | Software (deferred) | Open by design |
| Cursor pagination on all high-volume lists | Software (partial) | Phase 25 partial |
| Automated a11y CI | Software | Deferred |
| UX visual QA on production CDN build | Operator + QA | Pending after deploy |

## Not gaps (verified present)

- Permission overrides API + UI
- Toast deduplication
- Product tour + Help FAB
- Ops status/metrics endpoints (Phase 25 / Phase 20)
