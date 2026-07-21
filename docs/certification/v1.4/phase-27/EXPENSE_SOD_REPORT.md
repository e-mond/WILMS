# Expense SoD Report — Phase 27

## Prior state

`createExpense` inserted `APPROVED` and posted operating-cash ledger immediately (self-approval).

## Remediation

Lifecycle: **PENDING → APPROVED / REJECTED**

- Create: PENDING only; no ledger
- Review: requires `MANAGE_EXPENSES`; recorder cannot review own expense
- Approve: appends `OPERATING_EXPENSE` ledger (pool/principal untouched)
- Reject: requires reason; no ledger
- Idempotent re-approve of already-approved expense
- Summary counts approved vs pending; SQL aggregates for dashboard periods
- FE Expense Management: Approve / Reject actions

## Verification

- `tests/expenses/sod-self-approve.test.ts`

## Business note

Expenses still affect **operating cash only**, never loan principal or pool capital.
