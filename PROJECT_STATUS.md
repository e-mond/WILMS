# Project Status

**Last updated:** 2026-07-17 (v1.3.8 Phase 23 production cutover)  
**Package version:** `1.3.8`

## Current state

| Track | Status |
|-------|--------|
| Software / architecture / security / financial / docs | **CLOSED** |
| Public production deployment (v1.3.8) | **Verified** — health `ok`, commit `866d72ed…`, deployed `2026-07-17T19:12:38Z` |
| Operator cutover (authenticated smoke, Neon restore, human sign-offs) | **OPEN** |

**Verdict:** ⚠ **Ready with Conditions**  
**Certificate:** **NOT ISSUED** — see [`docs/certification/v1.3.8/production-cutover/FINAL_PRODUCTION_CERTIFICATE.md`](docs/certification/v1.3.8/production-cutover/FINAL_PRODUCTION_CERTIFICATE.md).

Tag `v1.3.8-production-certified` and branch `maintenance/v1.3.x` are **not** created until operator gates close. Procedure: [`MAINTENANCE_BRANCH_PLAN.md`](docs/certification/v1.3.8/production-cutover/MAINTENANCE_BRANCH_PLAN.md).

## Certification trail (v1.3.8)

| Pack | Path |
|------|------|
| Enterprise financial | `docs/certification/v1.3.8/enterprise-financial/` |
| Enterprise architecture | `docs/certification/v1.3.8/enterprise-architecture/` |
| Enterprise excellence | `docs/certification/v1.3.8/enterprise-excellence/` |
| RC validation | `docs/certification/v1.3.8/rc-validation/` |
| Production operations | `docs/certification/v1.3.8/production-operations/` |
| Product acceptance | `docs/certification/v1.3.8/product-acceptance/` |
| Go-live closure | `docs/certification/v1.3.8/go-live/` |
| **Production cutover (Phase 23)** | `docs/certification/v1.3.8/production-cutover/` |

## Remaining operator actions

1. Provide `WILMS_SMOKE_*` and run `smoke:production` + `smoke:rbac` against live  
2. Neon PITR restore drill with RTO/RPO log  
3. Authenticated financial reconcile against live DB  
4. Collect real human sign-offs (do not fabricate)  
5. Then issue certificate, tag, and create `maintenance/v1.3.x`

## Role of this file

Pointer to canonical readiness. Prefer the Phase 23 cutover pack over older root `FINAL_*` drafts when they conflict.
