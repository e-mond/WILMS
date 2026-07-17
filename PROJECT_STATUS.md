# Project Status

**Last updated:** 2026-07-17 (v1.3.8 Phase 21 product acceptance)  
**Package version:** `1.3.8`

## Current state

v1.3.8 is the product-acceptance candidate for daily organisational use by five staff roles.

**Verdict:** ⚠ **Ready with Conditions** — see [`docs/certification/v1.3.8/product-acceptance/FINAL_PRODUCT_CERTIFICATION.md`](docs/certification/v1.3.8/product-acceptance/FINAL_PRODUCT_CERTIFICATION.md).

Feature development for 1.3.8 is frozen. Remaining conditions are operational evidence (migrations on env, staging smoke, Neon restore drill), not open Critical product defects.

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
