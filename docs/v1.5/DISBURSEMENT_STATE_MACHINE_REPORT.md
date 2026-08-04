# Disbursement State Machine Report (v1.4.3)

## Dual status model

| Layer | Field | Purpose |
|-------|-------|---------|
| Internal | `lifecycleStatus` | Authoritative transitions / action gates |
| External | `status` / `externalStatus` | Compact portfolio badges (unchanged) |

`toExternalStatus()` still maps `DRAFT` / `PENDING_APPROVAL` / `APPROVED` / `PENDING_DISBURSEMENT` → external `PENDING_DISBURSEMENT`. That collapse remains for list/badge compatibility; UI gates now use `lifecycleStatus`.

## Transitions (unchanged)

```
DRAFT → PENDING_APPROVAL → APPROVED → PENDING_DISBURSEMENT → DISBURSED → ACTIVE
                              ↘ REJECTED
```

`approveLoan` continues to persist `PENDING_DISBURSEMENT` after approval (APPROVED is transitional).

## Disburse gate

`disburseLoan` requires:

1. `lifecycleStatus === PENDING_DISBURSEMENT`
2. Admin fee recorded for borrower
3. Pool capital / linkage checks

Rejects with `VALIDATION:LOAN_NOT_READY_FOR_DISBURSEMENT` → HTTP 422 code `LOAN_NOT_READY_FOR_DISBURSEMENT`.

## Frontend

- Approve button when lifecycle is pending approval
- Disburse button only when lifecycle is pending disbursement **and** eligibility allows
- Workflow stepper shows completed / current / upcoming steps with inline hints
