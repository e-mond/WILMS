# Project Status

**Last updated:** 2026-07-21 (v1.4.1 Phase 26 closure pass)  
**Package version:** `1.4.1`

## Current state

| Track | Status |
|-------|--------|
| v1.3.8 software line | **Frozen** — hotfixes only after `maintenance/v1.3.8` (post-certification) |
| v1.3.8 operator certification | **OPEN** (outside software) |
| v1.4.0 Phase 25 platform foundation | **COMPLETE (software)** |
| v1.4.1 UX shell + final-system hardening | **COMPLETE (software)** — PRs #132 / #136 / #137 on `main` |
| **v1.4.1 Phase 26 closure pass** | **COMPLETE (software documentation + remediations)** |

**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

**Phase 26 pack:** [`docs/certification/v1.4/phase-26/`](docs/certification/v1.4/phase-26/FINAL_SYSTEM_AUDIT.md)  
**Audit index:** [`docs/FINAL_AUDIT_INDEX.md`](docs/FINAL_AUDIT_INDEX.md)

### What shipped in Phase 26 (software remediations)

- Invitation expiry: `invitedAt + 7 days` on login + accept-invitation; resend refreshes `invitedAt`
- Adjustment maker-checker: requester cannot approve own adjustment; pool aggregates refreshed on approve
- Loan create/approve SoD: creator cannot approve own loan; `LOAN_CREATE` via `runWithIdempotency`
- Upload magic-byte MIME verification (JPEG/PNG/WEBP/PDF)
- Password policy: min 10 + letter + number (API + FE)
- `getPaymentById` uses `findPaymentById` (no 2000-row scan)

### What shipped in 1.4.1 (prior software)

- UX shell hardening (Dashboard ≠ Ops, sticky chrome, floating stack, Permission Catalog)
- Final-system-audit hardening (demo block, session assert, report fail-closed, FE headers, Node 22 deploy)

### What shipped in 1.4.0 (software)

- Node 22 everywhere (engines, Docker, `.nvmrc`, CI `verify:node`)
- Optional Redis/BullMQ with in-process fallback
- Idempotency hardening, cursor pagination, outbox, feature flags
- Extended `/ops` metrics + tracing spans

### Still blocked (operator / infra) — Production Certified

- Redis provisioned in staging/production (when durable queues required)
- Neon / PITR restore drill **PASSED** evidence
- Authenticated production smoke with real Super Admin credentials
- Residual Medium risk acceptance (invite token, expense SoD, sanitizers, rate limits, report SQL, dependency triage)
- Production certification certificate (**NOT ISSUED**)

## Planning hub

[`docs/planning/v1.4/INDEX.md`](docs/planning/v1.4/INDEX.md)

## Next

Complete [MANUAL_ACTIONS_REQUIRED.md](docs/certification/v1.4/phase-26/MANUAL_ACTIONS_REQUIRED.md) for controlled rollout. Do **not** stamp Production Certified until operator/infra evidence is attached.
