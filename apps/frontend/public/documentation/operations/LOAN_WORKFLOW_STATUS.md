# Loan workflow status (user-facing)

Displayed on the loan detail stepper. Internal statuses (draft, written-off, defaulted) map to the nearest public step and are not labelled.

```mermaid
flowchart TD
  A[Registration Submitted] --> B[Registration Approved]
  B --> C[Loan Created]
  C --> D[Loan Approved]
  D --> E[Admin Fee Paid]
  E --> F[Pending Disbursement]
  F --> G[Disbursed]
  G --> H[Active]
  H --> I[Closed]
```

When a loan record exists, registration submitted/approved and loan created are complete. Current step then follows lifecycle + admin-fee flag.
