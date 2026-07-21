# Project Status

**Last updated:** 2026-07-21 (v1.4.2 Phase 28)  
**Package version:** `1.4.2`

## Current state

| Track | Status |
|-------|--------|
| v1.3.8 software line | **Frozen** — hotfixes only after `maintenance/v1.3.8` |
| v1.4.0 Phase 25 platform foundation | **COMPLETE (software)** |
| v1.4.1 UX + final-system + Phase 26 | **COMPLETE (software)** — PRs #132 / #136 / #137 / #138 |
| **v1.4.2 Phase 27 residual Medium closure** | **COMPLETE** |
| **v1.4.2 Phase 28 multi-discipline closure** | **COMPLETE (software)** — 196 backend tests; operator gates open |

**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

**Phase 28 multi pack:** [`docs/certification/v1.4/phase-28-multi/`](docs/certification/v1.4/phase-28-multi/INDEX.md)  
**Phase 28 initial pack:** [`docs/certification/v1.4/phase-28/`](docs/certification/v1.4/phase-28/FINAL_PHASE_28_AUDIT.md)  
**Phase 27 pack:** [`docs/certification/v1.4/phase-27/`](docs/certification/v1.4/phase-27/FINAL_PHASE_27_AUDIT.md)  
**Audit index:** [`docs/FINAL_AUDIT_INDEX.md`](docs/FINAL_AUDIT_INDEX.md)

### What shipped in Phase 27 (software)

- Signed invitation accept tokens (hash-only storage, single-use, revoke, audit)
- Expense maker-checker: PENDING → APPROVED/REJECTED; recorder cannot self-approve; ledger on approve only
- SQL date-scoped daily collection + financial ledger queries; expense summary SQL aggregates
- Global API rate limiting (Redis-backed when `REDIS_URL` set)
- Collector onboard sets `invitedAt` and sends tokenized invite
- Migration `0029_v141_invitation_tokens`

### Operator gates still open

Staging smoke, backup/restore drill, live load test, demo purge confirmation, secrets/Redis verification, npm audit triage, human sign-off.
