# Project Status

**Last updated:** 2026-07-21 (v1.4.2 Phase 31)  
**Package version:** `1.4.2`

## Current state

| Track | Status |
|-------|--------|
| v1.4.2 Phase 29 certification closure | **COMPLETE (software)** |
| v1.4.2 Phase 30 payment notifications | **COMPLETE (software)** |
| **v1.4.2 Phase 31 final certification** | **COMPLETE (software)** — 206 backend tests; operator gates open |

**Verdict:** **READY WITH CONDITIONS**  
**Production Certified:** **NOT ISSUED**

**Phase 31 pack:** [`docs/certification/v1.4/phase-31/`](docs/certification/v1.4/phase-31/INDEX.md)  
**Phase 30 pack:** [`docs/certification/v1.4/phase-30/`](docs/certification/v1.4/phase-30/INDEX.md)  
**Phase 29 pack:** [`docs/certification/v1.4/phase-29/`](docs/certification/v1.4/phase-29/INDEX.md)

### What shipped in Phase 31 (software)

- `WILMS_SCHEDULER_TOKEN` cron authentication for notification + communications schedulers
- Scheduler last-run visibility in `/ops/status` and Prometheus
- GitHub Actions `notification-scheduler.yml` (secrets-driven daily cron)
- Operator evidence script `scripts/operator/run-notification-scheduler.sh`
- Full Phase 31 certification pack

### Operator gates still open

Staging smoke, money-chain, migration 0030 live, scheduler first-run evidence, mail/SMS delivery, backup/restore, load test, WCAG, demo purge, four sign-offs.
