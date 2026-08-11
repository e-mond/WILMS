# Final Phase 11 Report — Registration, Loan Workflow, Communications, Operations Hardening

**Product identity:** WILMS **v1.8.0** (unchanged)  
**Branch:** `feature/v1.8.0-registration-loan-communications-hardening`

## Executive summary

Phase 11 hardens production workflows: Assign Group feedback, Super Admin self-approval, pool capital checks at loan creation, borrower communication gaps, operational reassignment UI, and payment-day schedule recalculation — without changing the published version.

## Deliverables

| Document | Path |
|----------|------|
| Assign Group | `documentation/phase11/REGISTRATION_GROUP_ASSIGNMENT_FIX_REPORT.md` |
| SA loan policy | `documentation/phase11/SUPER_ADMIN_LOAN_POLICY_REPORT.md` |
| Pool capital | `documentation/phase11/POOL_CAPITAL_VALIDATION_REPORT.md` |
| Communications | `documentation/phase11/BORROWER_COMMUNICATION_LIFECYCLE.md` |
| Ops reassignment | `documentation/phase11/OPERATIONS_REASSIGNMENT_SPECIFICATION.md` |
| Payment day | `documentation/phase11/PAYMENT_DAY_REASSIGNMENT_SPECIFICATION.md` |
| Notification propagation | `documentation/phase11/NOTIFICATION_PROPAGATION_REPORT.md` |
| Test evidence | `documentation/phase11/TEST_EVIDENCE.md` |

## Implementation highlights

1. Approver Assign Group toasts, fixed error copy, query invalidation, audit + group-assigned notify.
2. Super Admin exception on loan self-approval.
3. Pool available-capital gate on create (API + Create Loan wizard).
4. Registration submitted notifications; enriched approval copy; schedule SMS event separation.
5. `/ops/reassignment` for group/collector/payment-day with preview.
6. Payment-day approval recalculates pending due dates.

## Validation

| Gate | Result |
|------|--------|
| type-check | Passed |
| lint | Passed |
| frontend test | 272 passed |
| Phase 11 domain tests | Passed |
| build | Passed |

## Migrations

None required for this phase (no schema changes).

## Remaining risks

- Active-loan group transfers still blocked pending approval workflows; operators must use enterprise approval paths where required.
- Payment-day **approval** UI remains on enterprise endpoints; Ops UI creates the request and relies on the existing approve route.
- Full end-to-end SMS against live providers depends on environment configuration.
- Domain SoD import-heavy tests can be slow under parallel suite load (timeout hardened).

## Merge recommendation

**YES — merge to `main`** after a short staging smoke of:

1. Approver Assign Group (toast + membership)
2. Create loan with insufficient pool capital (blocked)
3. Super Admin approve own loan
4. `/ops/reassignment` preview + transfer/reassign
