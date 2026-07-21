# Project Status

**Last updated:** 2026-07-21 (v1.4.2 Phase 30)  
**Package version:** `1.4.2`

## Current state

| Track | Status |
|-------|--------|
| v1.3.8 software line | **Frozen** — hotfixes only after `maintenance/v1.3.8` |
| v1.4.2 Phase 29 certification closure | **COMPLETE (software)** |
| **v1.4.2 Phase 30 payment notifications** | **COMPLETE (software)** — 202 backend tests |

**Verdict:** **READY WITH CONDITIONS** (Phase 29 operator gates + Phase 30 provider/cron gates)  
**Production Certified:** **NOT ISSUED**

**Phase 30 pack:** [`docs/certification/v1.4/phase-30/`](docs/certification/v1.4/phase-30/INDEX.md)  
**Phase 29 pack:** [`docs/certification/v1.4/phase-29/`](docs/certification/v1.4/phase-29/INDEX.md)  
**Audit index:** [`docs/FINAL_AUDIT_INDEX.md`](docs/FINAL_AUDIT_INDEX.md)

### What shipped in Phase 30 (software)

- Idempotent payment notification domain (`notification_delivery_records`)
- Scheduled payment due-soon reminders (HTTP cron job)
- Missed-payment notifications: borrower SMS + collector in-app + admin summary
- Payment confirmation dedupe by `paymentId`
- Migration `0030_v142_notification_dedupe`
- Prometheus notification metrics on `/ops/metrics`

### Operator gates still open

Phase 29 gates unchanged. Phase 30 adds: production scheduler cron, live SMS/email delivery evidence.
