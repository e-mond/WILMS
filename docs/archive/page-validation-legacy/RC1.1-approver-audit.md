# RC1.1 ÔÇö Approver Module Audit

**Date:** 2026-07-01

## Routes

| Page | Component | API |
|------|-----------|-----|
| `/approver/pending` | `PendingApplicationsQueue` | `GET /borrowers?status=PENDING` |
| `/approver/pending/[id]` | `PendingApplicationReview` | `GET /borrowers/:id`, approve/reject mutations |
| `/approver/reviewed` | `ReviewedApplicationsPanel` | `GET /borrowers/reviewed` |

## Service wiring

- [`approvalService.ts`](../../apps/frontend/src/services/approvalService.ts) uses `apiClient` ÔÇö no mock imports in features.
- Approve/reject flows write audit entries via backend.

## UX (RC1.1)

- `PendingApplicationsQueue` ÔÇö `useQueryLoadingPolicy` + `QueryStatePanel` (skeleton, timeout, retry)
- Unit tests: `PendingApplicationsQueue.test.tsx`, `PendingApplicationReview.test.tsx`

## Verdict

**PASS** ÔÇö Live API; no seeded approval queues in production paths.
