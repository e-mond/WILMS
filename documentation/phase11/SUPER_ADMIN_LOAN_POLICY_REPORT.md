# Super Admin Loan Policy Report

**Product:** WILMS v1.8.0  
**Status:** Implemented

## Policy

| Role | Create | Approve own loan | Disburse own loan |
|------|--------|------------------|-------------------|
| Super Admin | Yes | **Allowed** (final authority) | Allowed (no additional SoD block) |
| Other roles | Per RBAC | **Blocked** (maker-checker) | Existing rules unchanged |

## Implementation

`approveLoan` loads the actor via `userRepo.getUserById`. Self-approval is blocked unless `role === SUPER_ADMIN`.

Audit continues to record `approvedByUserId` and lifecycle timestamps.

## Tests

- `packages/domain/src/tests/loans/sod-self-approve.test.ts`
  - Blocks non–Super Admin creator
  - Allows Super Admin creator
