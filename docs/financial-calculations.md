# WILMS Financial Calculations (v1.3.8)

Single source of truth for organisation-wide and pool-level **operational** metrics.

> **Statutory GL:** WILMS does not yet implement double-entry general ledger / trial balance.
> See [enterprise-architecture/DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md](certification/v1.3.8/enterprise-architecture/DOUBLE_ENTRY_LEDGER_MIGRATION_ROADMAP.md).

## Loan pool ledger

Each pool maintains an append-only `pool_allocations` ledger:

| Event | Allocation type | Effect |
|-------|-----------------|--------|
| Pool created / capital injected | `REPLENISHMENT` | Increases pool capital |
| Loan disbursed from pool | `DISBURSEMENT` | Increases disbursed; reduces available capital |
| Borrower repayment | `REPAYMENT` | Increases collected; reduces outstanding |
| Manual correction | `ADJUSTMENT` | Capital correction (audited) |

### Per-pool formulas

```
disbursed_pesewas     = SUM(DISBURSEMENT allocations)
collected_pesewas     = SUM(REPAYMENT allocations)
outstanding_pesewas   = MAX(disbursed − collected, 0)
available_capital     = capital_pesewas − outstanding_pesewas
utilisation_percent   = MIN(ROUND(disbursed / capital × 100), 100)
repayment_rate_percent = ROUND(collected / disbursed × 100, 1)   [when disbursed > 0]
```

Pool list and dashboard merge loan portfolio totals when allocation aggregates lag (runtime reconcile + migration `0025`).

## Organisation dashboard (`buildDashboardFinancialOverview`)

| Metric | Calculation |
|--------|-------------|
| Pool funds | `SUM(pool.capital_pesewas)` |
| Total disbursed | `MAX(pool disbursed sum, loan portfolio disbursed)` |
| Total collected | `SUM(confirmed payments)` |
| Outstanding | `MAX(pool outstanding sum, active/defaulted loan balances)` |
| Available capital | `pool funds − outstanding` |
| Net collections after expenses | `MAX(total collected − approved expenses, 0)` |
| Net operating cash | `collections + admin fees collected − expenses` |

Expenses are deducted from **operating cash** (collections), not from loan principal.

## Collections variance (daily report)

```
variance_pesewas = collected_pesewas − expected_pesewas
```

Expected is the sum of weekly instalments for borrowers due on the report date (payment day match).

## Reconciliation

```
primary_variance = physical_cash − expected_due
collection_delta = physical_cash − system_recorded
```

Variance is **flagged** (no auto-approve) when any of:

- `collection_delta ≠ 0` (physical ≠ system-recorded)
- `expected_due = 0` and physical cash ≠ 0
- absolute primary variance ≥ 100 pesewas (1 GHS floor)
- percentage variance exceeds configured threshold (default 10%)

Review requires `access-admin-portal` (Super Admin). Collectors are bound to their own `collectorId`. REJECTED/REOPENED rows may be resubmitted (history preserved).

## Data integrity workflow

```
Pool created → Capital (REPLENISHMENT)
            → Loan created PENDING_APPROVAL (admin fee required)
            → Approve → PENDING_DISBURSEMENT
            → Disbursement (DISBURSEMENT allocation; capital hard stop)
            → Collection (REPAYMENT allocation; GPS required)
            → Reversal (negative REPAYMENT allocation + ledger REVERSAL)
            → Expense (operating cash ledger ADJUSTMENT; never principal)
            → Dashboard / Reports / Exports (pool + confirmed payments + expenses)
```
