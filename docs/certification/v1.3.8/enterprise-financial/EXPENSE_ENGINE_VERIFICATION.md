# Expense Engine Verification

**Date:** 17 July 2026  
**Finding closed:** C-03

## Accounting treatment

```
Expense recorded (status APPROVED at create)
  → expenses row
  → ledger_entries ADJUSTMENT { kind: OPERATING_EXPENSE }
  → audit expense.recorded
  → dashboard netOperatingCash -= amount
```

## Explicit non-effects

| Account | Affected by expense? |
|---|---|
| Loan principal | **No** |
| Loan outstanding | **No** |
| Pool capital | **No** |
| Pool outstanding / utilisation | **No** |
| Operating cash (KPI) | **Yes** |
| Reports / exports using expense summary | **Yes** |

## Product note

There is no separate multi-step expense approval workflow; recording is the recognition event. Review endpoints remain for reject/correction paths but do not gate recognition.
