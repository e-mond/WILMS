# Financial Reconciliation Report

**Date:** 17 July 2026

## Identity equations

```
Available capital     = Σ pool.capital − Σ pool.outstanding
Disbursed             = Σ pool DISBURSEMENT allocations (or portfolio when no pools)
Collected (net)       = Σ CONFIRMED payments  (= REPAYMENT − REVERSAL at ledger)
Outstanding           = Σ active/defaulted loan balances
Net operating cash    = Collected + Admin fees − Expenses
```

Expenses **do not** reduce Available capital or Outstanding.

## Reconciliation controls

| Control | Behaviour |
|---|---|
| Auto-approve | Only when variance unflagged |
| Flag rules | % threshold **or** abs ≥ 100 pesewas **or** physical≠system **or** expectedDue=0 with cash≠0 |
| Collector scope | `collectorId` bound to session |
| Review | `ACCESS_ADMIN_PORTAL` only |
| Resubmit | Allowed from REJECTED / REOPENED with history |

## Dashboard alignment

`buildDashboardFinancialOverview` documents `ledgerSource` for pools, payments, expenses, and admin fees so executive KPIs and reports share the same derivation rules.
