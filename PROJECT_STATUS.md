# Project Status

**Last updated:** 2026-07-21 (v1.4.2 Phase 29)  
**Package version:** `1.4.2`

## Current state

| Track | Status |
|-------|--------|
| v1.3.8 software line | **Frozen** — hotfixes only after `maintenance/v1.3.8` |
| v1.4.0 Phase 25 platform foundation | **COMPLETE (software)** |
| v1.4.1 UX + final-system + Phase 26 | **COMPLETE (software)** |
| v1.4.2 Phase 27 residual Medium closure | **COMPLETE** |
| v1.4.2 Phase 28 multi-discipline closure | **COMPLETE (software)** |
| **v1.4.2 Phase 29 certification closure** | **COMPLETE (software)** — 13/13 automated gates; operator gates open |

**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

**Phase 29 pack:** [`docs/certification/v1.4/phase-29/`](docs/certification/v1.4/phase-29/INDEX.md)  
**Phase 28 multi pack:** [`docs/certification/v1.4/phase-28-multi/`](docs/certification/v1.4/phase-28-multi/INDEX.md)  
**Audit index:** [`docs/FINAL_AUDIT_INDEX.md`](docs/FINAL_AUDIT_INDEX.md)

### What shipped in Phase 29 (software)

- Financial harness fix (23/23 PASS — wrong-payment-day fixture)
- `npm run verify:phase29` consolidated verification runner
- Operator staging gate script + evidence templates
- Environment variable documentation table
- Full Phase 29 certification pack (17 reports + 3 manifests)

### Operator gates still open

Staging smoke, money-chain, migration 0029 live, backup/restore drill, load test, production secrets, demo purge, WCAG manual, browser/mobile, mail/SMS/upload, monitoring, incident/rollback drills, four sign-offs.

Run automated pre-check: `npm run verify:phase29`
