# Cross-Module Validation

**Date:** 17 July 2026

## Primary money chain (verified in code)

```text
Admin fee recorded
  → createLoan (PENDING_APPROVAL) + schedule + ledger note
  → approveLoan (PENDING_DISBURSEMENT) + ledger note
  → disburseLoan
       → disbursement row
       → ledger LOAN_DISBURSEMENT
       → pool DISBURSEMENT allocation + refreshPoolAggregates
       → notifyLoanDisbursed (collector + borrower channels)
  → recordPayment
       → schedule week PAID
       → loan balance update
       → ledger REPAYMENT
       → pool REPAYMENT + refresh
       → notifyPaymentReceived
  → reversePayment
       → ledger REVERSAL
       → negative pool REPAYMENT + refresh
  → createExpense
       → expenses row
       → ledger ADJUSTMENT { OPERATING_EXPENSE }
       → dashboard netOperatingCash -= expense
  → reconciliation submit
       → snapshot + history
       → notify Super Admin if flagged
```

## Propagation matrix

| Event | Pool | Loan balance | Ledger | Dashboard | Audit | Notify |
|---|---|---|---|---|---|---|
| Disburse | ✓ | ✓ | ✓ | via aggregates | ✓ | ✓ |
| Collect | ✓ | ✓ | ✓ | SQL sums | ✓ | ✓ |
| Reverse | ✓ | ✓ | ✓ | SQL nets | ✓ | ✓ |
| Expense | — (by design) | — | ✓ | netOperatingCash | ✓ | — |
| Recon | — | — | — | operational reports | ✓ | if flagged |

## Broken synchronization found

| Issue | Severity | Status |
|---|---|---|
| Recon history readable cross-collector | High | **Fixed in RC branch** |

No other broken money-path synchronization identified in service code.
