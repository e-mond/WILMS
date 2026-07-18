# Project Status

**Last updated:** 2026-07-18 (v1.4.0 Phase 25 platform foundation)  
**Package version:** `1.4.0`

## Current state

| Track | Status |
|-------|--------|
| v1.3.8 software line | **Frozen** — hotfixes only after `maintenance/v1.3.8` (post-certification) |
| v1.3.8 operator certification | **OPEN** (outside software) |
| **v1.4.0 Phase 25 platform foundation** | **COMPLETE (software)** — merge candidate |

**Phase 25 pack:** [`docs/certification/v1.4/phase-25/`](docs/certification/v1.4/phase-25/INDEX.md)

### What shipped in 1.4.0 (software)

- Node 22 everywhere (engines, Docker, `.nvmrc`, CI `verify:node`)
- Optional Redis/BullMQ with in-process fallback
- Idempotency hardening (payload hash + production require flag)
- Cursor pagination foundation (borrowers keyset)
- Transactional outbox table + publisher
- Feature flags (`WILMS_FLAG_*`)
- Extended `/ops` queue metrics + tracing spans
- Backup/restore drill script (operator credentials required for PASSED)

### Still blocked (operator / infra)

- Redis provisioned in staging/production
- Neon restore drill **PASSED** evidence
- Production deploy of 1.4.0
- Authenticated production smoke

## Planning hub

[`docs/planning/v1.4/INDEX.md`](docs/planning/v1.4/INDEX.md)

## Next

Do **not** start Phase 26 without explicit approval. Next operator steps: provision Redis, run restore drill, deploy 1.4.0 to staging, smoke.
