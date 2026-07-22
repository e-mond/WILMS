# Project Status

**Last updated:** 2026-07-22 (v1.4.2 Phase 32)  
**Package version:** `1.4.2`

## Current state

| Track | Status |
|-------|--------|
| v1.4.2 Phase 29 certification closure | **COMPLETE (software)** |
| v1.4.2 Phase 30 payment notifications | **COMPLETE (software)** |
| v1.4.2 Phase 31 final certification | **COMPLETE (software)** |
| **v1.4.2 Phase 32 operator evidence** | **EXECUTED** — 208 backend / 253 frontend tests; 14 operator gates BLOCKED |

**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

**Phase 32 pack:** [`docs/certification/v1.4/phase-32/`](docs/certification/v1.4/phase-32/INDEX.md)  
**Phase 31 pack:** [`docs/certification/v1.4/phase-31/`](docs/certification/v1.4/phase-31/INDEX.md)  
**Phase 30 pack:** [`docs/certification/v1.4/phase-30/`](docs/certification/v1.4/phase-30/INDEX.md)  
**Phase 29 pack:** [`docs/certification/v1.4/phase-29/`](docs/certification/v1.4/phase-29/INDEX.md)

### What shipped in Phase 32 (software)

- Live gate tracker: `npm run verify:phase32` + `gate-status.json`
- Operator gate scripts under `scripts/operator/run-*-gate.sh`
- **Fix:** `publicSchedulerRouter` — scheduler token auth now reachable (was 401)
- HTTP integration test `scheduler-http.test.ts`
- Phase 32 certification pack with sign-off templates

### Operator gates still open

Staging smoke, money-chain, migration 0030 live, mail/SMS delivery, backup/restore, staging load test, WCAG/browser QA, production config, demo purge, incident drills, four sign-offs.
