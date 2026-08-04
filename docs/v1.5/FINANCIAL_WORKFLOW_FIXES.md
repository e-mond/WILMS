# Financial Workflow Fixes (v1.4.3)

## Loan lifecycle visibility

- Backend exposes `lifecycleStatus` alongside external `status`.
- UI stepper: Application Submitted → Admin Fee Paid → Approved → Pending Disbursement → Disbursed → Active → Closed.
- Approve is available when lifecycle is `PENDING_APPROVAL` / `DRAFT` and admin fee is satisfied.
- Disburse is enabled only when lifecycle is `PENDING_DISBURSEMENT` and disbursement eligibility passes.

## Friendly errors

| Scenario | User message |
|----------|----------------|
| Disburse before approval | This loan is not ready for disbursement yet. Complete approval and admin-fee requirements first. |
| Missing idempotency (recon) | We could not submit today’s reconciliation. Please try again… |
| Network | Retry / Refresh / Return to Dashboard |

## Integrity preserved

- Maker-checker / SoD on approve and adjustments unchanged.
- `runWithIdempotency` scopes unchanged.
- SQL financial aggregations untouched.
- Display IDs (LN-, GRP-, …) preserved and preferred over UUIDs on review.
