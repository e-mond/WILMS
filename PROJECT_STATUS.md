# Project Status

**Last updated:** 2026-07-17 (Phase 24 v1.4 planning)  
**Package version:** `1.3.8` (frozen — new work targets **v1.4** on `main`)

## Current state

| Track | Status |
|-------|--------|
| v1.3.8 software / architecture / security / financial / docs | **CLOSED** |
| v1.3.8 operator certification | **OPEN** (outside software dev) |
| **v1.4 planning (Phase 24)** | **COMPLETE** — [`docs/planning/v1.4/`](docs/planning/v1.4/INDEX.md) |

**v1.3.8 verdict:** ⚠ **Ready with Conditions** — certificate **NOT ISSUED**.  
**v1.4:** All new features and architecture changes belong on `main` (or `feature/v1.4-*`); **do not patch v1.3.x** except hotfixes after `maintenance/v1.3.8` exists.

## v1.4 planning hub

| Document | Path |
|----------|------|
| Index | `docs/planning/v1.4/INDEX.md` |
| v1.3.x maintenance strategy | `docs/planning/v1.4/V13_MAINTENANCE_STRATEGY.md` |
| v1.4 roadmap | `docs/planning/v1.4/WILMS_V14_ROADMAP.md` |
| Master timeline | `docs/planning/v1.4/MASTER_ROADMAP.md` |
| Executive strategy | `docs/planning/v1.4/EXECUTIVE_STRATEGY.md` |

## v1.3.8 certification trail

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
