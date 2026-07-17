# Project Status

**Last updated:** 2026-07-17 (v1.3.8 Phase 22 go-live closure)  
**Package version:** `1.3.8`

## Current state

v1.3.8 software readiness is **closed**. Public production health reports `version: 1.3.8` with migration watermark including `0027`.

**Verdict:** ⚠ **Ready with Conditions** — software closed; operator evidence still open.  
Canonical decision: [`docs/certification/v1.3.8/go-live/FINAL_CERTIFICATION_DECISION.md`](docs/certification/v1.3.8/go-live/FINAL_CERTIFICATION_DECISION.md).

Feature development for 1.3.8 remains frozen. Remaining conditions are operator-only (authenticated smoke, Neon restore drill, formal sign-offs).

## Certification trail (v1.3.8)

| Pack | Path |
|------|------|
| Enterprise financial | `docs/certification/v1.3.8/enterprise-financial/` |
| Enterprise architecture | `docs/certification/v1.3.8/enterprise-architecture/` |
| Enterprise excellence | `docs/certification/v1.3.8/enterprise-excellence/` |
| RC validation | `docs/certification/v1.3.8/rc-validation/` |
| Production operations | `docs/certification/v1.3.8/production-operations/` |
| **Product acceptance (Phase 21)** | `docs/certification/v1.3.8/product-acceptance/` |

## Local gates

| Gate | Status |
|------|--------|
| type-check / lint | Expected pass on `main` |
| Unit tests (API + frontend) | Expected pass |
| Production smoke | Requires `WILMS_SMOKE_*` credentials |
| Migration `0027` on production | Ops evidence required |
| Neon PITR restore drill | Ops evidence required |

## Role of this file

Pointer to canonical readiness. Prefer the Phase 21 acceptance pack over older root `FINAL_*` drafts when they conflict.
