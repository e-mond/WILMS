# WILMS Financial Calculations (v1.3.7)

Single source of truth for organisation-wide and pool-level metrics.

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
```

Balanced submissions (`variance_flagged = false`) auto-approve. Review is required only when variance exceeds the configured threshold and expected due > 0.

## Data integrity workflow

```
Pool created → Capital (REPLENISHMENT)
            → Loan created (loan_pool_id from group membership)
            → Disbursement (DISBURSEMENT allocation)
            → Collection (REPAYMENT allocation)
            → Expense (deducted from operating cash, audited)
            → Dashboard / Reports / Exports (same aggregates)
```
