# Collector payment workflow — test evidence

**Product version:** 1.8.0  
**Branch:** `feature/v1.8.0-collector-payment-workflow`  
**Date:** 2026-08-11  
**Language:** British English  

## Commands executed

| Check | Result |
|-------|--------|
| `npm run test -w @wilms/domain -- --run src/tests/payment/multi-week-allocation.test.ts` | PASS (8 tests) |
| Frontend vitest: PaymentEntryPanel, group-collection-sheet.utils, groupService.mock.membership, useRecordPaymentOrQueue | PASS (13 tests) |
| `npm run type-check -w @wilms/domain` | PASS |
| `npm run type-check -w @wilms/frontend` | PASS |

## Coverage notes

- Multi-week oldest-first allocation and grace/escalation helpers covered in domain unit tests.
- Approver assign-group mock membership rules still pass after borrowerId linking.
- Payment entry UI covers current-week confirm (online GPS + offline queue).
- Device / live SMS / airplane-mode proofs were **not** fabricated; rely on existing scheduler + notification infrastructure.

## Not claimed in this evidence pack

- Full monorepo `npm run test`
- Production build (run in CI on PR)
- Live device GPS / SMS delivery
