# Production Financial Validation — WILMS v1.3.8

**Date:** 17 July 2026  
**Phase:** 23 — Production Cutover  
**Owner track:** Finance + Engineering  
**Status:** **Pending** (no live DB access)

---

## Summary

| Validation area | Local / unit (Phase 21–22) | Live production | Status |
|-----------------|----------------------------|-----------------|--------|
| Money-chain automated tests | **PASS** (36/36 security subset) | Not re-run | **Complete** (software) |
| Authenticated money-chain smoke | — | **Not executed** | **Pending** |
| Live financial DB reconcile | — | **Not executed** | **Pending** |
| Balance derivation (SoT rules) | Unit-covered | Not verified on prod data | **Pending** |
| Duplicate payment blocking | Unit-covered | Not verified live | **Pending** |
| Overpayment blocking | Unit-covered | Not verified live | **Pending** |
| Admin fee before disbursement | Unit-covered | Not verified live | **Pending** |
| Immutable audit log | Unit-covered | Not verified live | **Pending** |

**Financial cutover verdict:** **⚠ READY WITH CONDITIONS** — software rules are tested locally; **live financial reconciliation was not executed** because `DATABASE_URL` is **UNSET**.

---

## Credential constraint

**Source:** `evidence/credential-audit-20260717T193511Z.txt`

| Variable | Status | Blocks |
|----------|--------|--------|
| `DATABASE_URL` | **UNSET** | `verify:financial`, reconciliation queries, concurrency certs |
| `WILMS_SMOKE_EMAIL` | **UNSET** | Live money-chain smoke |
| `WILMS_SMOKE_PASSWORD` | **UNSET** | Live money-chain smoke |

---

## What production health confirms (not financial proof)

From `evidence/prod-health-20260717T193511Z.json`:

| Signal | Value | Financial implication |
|--------|-------|----------------------|
| `database.connected` | `true` | API can reach DB — **not** balance correctness |
| `schema.status` | `ok` | Tables present — **not** row integrity |
| `migrations.status` | `ok` | Schema revision current — **not** transaction sums |
| `migrations.latestJournalWhen` | `1784296800000` (`0027`) | Index migration applied |

Health probes confirm **connectivity and schema posture**. They do **not** substitute for financial reconciliation.

---

## WILMS financial invariants (reference)

Per BRD and certification packs — must be verified on **live** data before certificate issuance:

| Rule | Verification method | Status |
|------|---------------------|--------|
| No partial payments | Smoke + SQL spot-check | **Pending** |
| No advance payments | Smoke + obligation query | **Pending** |
| Oldest obligation cleared first | Collection smoke + ledger query | **Pending** |
| Balances derived from transactions only | `verify:financial` against prod read replica | **Pending** |
| Admin fee confirmed before disbursement | Disbursement smoke | **Pending** |
| Overpayment blocked | Negative test in smoke | **Pending** |
| Duplicate txn blocked | Concurrency / duplicate test | **Pending** |
| Audit log immutable | DB trigger / API negative test | **Pending** |

---

## Required evidence to close

| # | Action | Command / method | Evidence artifact | Status |
|---|--------|------------------|-------------------|--------|
| 1 | Run production money-chain smoke | `npm run smoke:production` | `evidence/smoke-production-*.log` | **Pending** |
| 2 | Run financial verification (read-only) | `npm run verify:financial -w @wilms/api` | `evidence/financial-verify-*.log` | **Pending** |
| 3 | Reconciliation spot-check | SQL: sum(payments) vs derived balances sample | `evidence/financial-reconcile-*.sql.out` | **Pending** |
| 4 | Zero orphan obligations | Query open obligations vs active loans | `evidence/financial-orphans-*.sql.out` | **Pending** |
| 5 | Finance sign-off | [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) | Signature block | **Pending** |

---

## Software track reference (closed)

Phases 21–22 established:

- Money-chain unit and integration tests passing locally
- Security regression suite includes financial IDOR and payment actor tests
- Product acceptance documents financial workflow validation (mock/staging scope)

Phase 23 **does not downgrade** software closure. It records that **operator-track live financial validation remains open**.

---

## Decision

Live production financial validation: **Pending**.

Cutover may proceed under **⚠ READY WITH CONDITIONS** with software track **CLOSED** and operator financial reconcile **OPEN**. Certificate issuance requires attached reconcile evidence and Finance sign-off.
