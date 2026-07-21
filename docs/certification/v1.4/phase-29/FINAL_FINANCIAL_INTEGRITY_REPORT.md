# Final Financial Integrity Report

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

## Ledger Model

WILMS uses an **operational sub-ledger** (loans, payments, expenses, pools, reconciliations). It is **not** a statutory double-entry general ledger. Do not claim GL compliance.

## Authoritative Sources

| Metric | Source | Filter |
|--------|--------|--------|
| Outstanding balance | `loans.loan_balance` | Active loans |
| Collections | `payments.amount_pesewas` | status ≠ REVERSED |
| Expenses | `expenses.amount_pesewas` | status = APPROVED |
| Pool capital | loan pool allocations | Transactional writes |
| Defaulter status | SQL CTE over schedules + payments | No 2000-row cap |

## Financial Harness — Phase 29 Fix

| Check | Before | After |
|-------|--------|-------|
| `rejects-wrong-payment-day` | False PASS (Friday date coincidence) | **PASS** — reference date `2026-05-13` (Wednesday) |
| Full harness | 22/23 | **23/23 PASS** |

Command: `npm run verify:financial -w @wilms/api`

## SQL Aggregation (Phase 28 multi, re-verified)

| Surface | Method |
|---------|--------|
| Collector KPIs | `sumConfirmedPaymentsByCollector()` |
| Collector portal daily | Date-scoped SQL |
| Analytics | SQL sum/count by `recordedAt` |
| Group detail stats | `getGroupListStats()` |
| Defaulter report | SQL CTEs |
| Ledger repayments | SQL SUM |

## Maker-Checker

Seven financial workflows enforce separation of duties (recorder ≠ approver). All have regression tests.

## Idempotency

Money-changing POST operations support idempotency keys when `WILMS_FLAG_IDEMPOTENCY` enabled (production default).

## Concurrency

`stress/in-memory-concurrency.test.ts` covers concurrent payment scenarios.

## Live Money-Chain

**BLOCKED** — operator must execute full lifecycle on staging and reconcile pool/collections/outstanding. Template: `templates/MONEY_CHAIN_EVIDENCE_TEMPLATE.md`

## Status

**PASS (code-level)** | Live reconciliation **BLOCKED**
