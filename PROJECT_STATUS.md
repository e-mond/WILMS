# Project Status

**Last updated:** 2026-07-18 (v1.4.1 UX shell hardening)  
**Package version:** `1.4.1`

## Current state

| Track | Status |
|-------|--------|
| v1.3.8 software line | **Frozen** — hotfixes only after `maintenance/v1.3.8` (post-certification) |
| v1.3.8 operator certification | **OPEN** (outside software) |
| v1.4.0 Phase 25 platform foundation | **COMPLETE (software)** |
| **v1.4.1 UX shell hardening** | **IN PROGRESS / merge candidate** |

**UX pack:** [`docs/certification/v1.4/ux-modernisation/`](docs/certification/v1.4/ux-modernisation/FULL_AUDIT_INDEX.md)

### What shipped in 1.4.1 (software)

- Fixed `/ops` middleware redirect collision with `/dashboard`
- Sticky enterprise header + full-height sidebar shell
- Floating action stack (Help + connectivity never overlap)
- Permission Catalog list redesign with search/copy key
- Command-palette navigation (Dashboard vs Operations distinct)
- Documentation and audit deliverables updated

### What shipped in 1.4.0 (software)

- Node 22 everywhere (engines, Docker, `.nvmrc`, CI `verify:node`)
- Optional Redis/BullMQ with in-process fallback
- Idempotency hardening, cursor pagination, outbox, feature flags
- Extended `/ops` metrics + tracing spans

### Still blocked (operator / infra)

- Redis provisioned in staging/production
- Neon restore drill **PASSED** evidence
- Authenticated production smoke with real Super Admin credentials
- Production certification certificate (**NOT ISSUED**)

## Planning hub

[`docs/planning/v1.4/INDEX.md`](docs/planning/v1.4/INDEX.md)

## Next

Do **not** start Phase 26 without explicit approval. Deploy 1.4.1 after CI green; complete operator smoke and visual QA of shell chrome.
