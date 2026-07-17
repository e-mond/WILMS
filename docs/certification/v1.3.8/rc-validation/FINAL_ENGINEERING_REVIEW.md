# Final Engineering Review (Acquisition Lens)

**Date:** 17 July 2026  
**Question:** Would a Fortune 500 acquirer approve WILMS as-is?

## Decision

**No — not for acquisition as a core financial system of record.**  
**Yes — as an operational field-lending product RC** with a clear remediation roadmap (v1.4–v2.0).

## Remaining weaknesses (ranked)

### Critical

| ID | Weakness | Remediation |
|---|---|---|
| — | **None identified** in RC validation after RC-01 fix | — |

### High

| ID | Weakness | Remediation |
|---|---|---|
| H1 | No durable job queue (mail/SMS/scheduler in-process) | Redis/BullMQ or pg-boss + DLQ |
| H2 | Optional Idempotency-Key on money POSTs | Require header; update offline queue |
| H3 | List/KPI paths still load-bound (borrowers/loans/expenses) | SQL aggregates + cursor pages |
| H4 | No statutory double-entry GL / trial balance | Dual-write GL (Phase 17 roadmap) |
| H5 | Observability below enterprise SRE bar | OTel + request IDs + alerts |
| H6 | Multi-branch org model absent (“100 branches”) | Org-unit schema + ABAC |

### Medium

| ID | Weakness | Remediation |
|---|---|---|
| M1 | Audit logs not hash-chained | Hash chain + WORM export |
| M2 | Upload MIME trust | Magic-byte validation |
| M3 | Offline queue in localStorage | IndexedDB |
| M4 | Client-side pagination UX | Server pages |
| M5 | Secret rotation ops maturity | Runbook + dual secrets |
| M6 | Node 20/22 skew | Standardize on 22 |

### Low

| ID | Weakness | Remediation |
|---|---|---|
| L1 | Unused INTEREST_CHARGE enum writers | Document or remove in later migration |
| L2 | Root FINAL_* doc sprawl | Continue archive |
| L3 | Mock `editPayment` interface residual | Cleanup PR |

## Large-dataset appendix (Phase 19.4)

At 10k loans / 100k payments / 500 collectors, expect pressure on list-bound dashboard segments, expense full scans, Neon pool, and in-process notifications. Phase 18 SQL KPI work helps collections totals; it does **not** alone certify million-row readiness.

## UX friction (Phase 19.8) — summary

- Role portals are clear; “Executive/Supervisor/Borrower” as separate logins do not exist (by design).  
- Tour 2.0 improves onboarding; sparse in-page anchors remain.  
- Money error recovery improved by immutable payment messaging.  
- Mobile collector flows primary; dense admin tables need server pagination for excellence.
