# Phase 32 — Final Financial Report

**Status:** Harness PASS | Live money-chain BLOCKED

## Automated

`verify:financial`: **23/23 PASS** (database checks skipped without `DATABASE_URL`).

Unit checks cover installment math, payment-day rules, obligation ordering, loan status transitions.

## Blocked

Full money-chain on staging (G4): registration → disbursement → payment → notification → reversal → reconciliation → reports.

## Notification financial integration

Payment confirmations are post-commit. Scheduler uses authoritative schedule (`payment-scheduler.service.ts`). Dedupe via `notification_delivery_records`.
