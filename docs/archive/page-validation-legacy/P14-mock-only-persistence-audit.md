# P14 Mock-Only Persistence & Business Rules Audit

**Date:** 2026-06-09  
**Scope:** Evidence from `src/services/mock/`, stores, sync modules, and API stub rejections. Frontend remains source of truth; no P11ÔÇôP13 regressions reopened.

## 1. Explicit API stub rejections (cannot fulfill without backend)

| Method | File:line | Mock behavior |
|--------|-----------|---------------|
| `deleteRegistration` | Was `borrowerService.ts:83-86` | Mock: `borrowerService.mock.ts:393+` ÔÇö **P14 backend implements DELETE** |
| `simulatePhoneCapture` | `photoCaptureSessionService.ts:13-14` | Mock: `photoCaptureSessionService.mock.ts:41-58` ÔÇö **still mock-only** |

## 2. In-memory persistence (mock stores)

| Store | File | Data |
|-------|------|------|
| Borrower registry | `borrower-registry.store.ts` | Registrations, statuses |
| Upload records | `upload.store.ts` | Base64 data URLs |
| Payment transactions | `payment-transaction.store.ts` | Collections |
| Audit log | `audit-log.store.ts` | Append-only entries |
| Group formation queue | `group-formation.store.ts` | Approved-by-community queues |
| Loan schedules | `loan-schedule.store.ts` | Repayment weeks |
| Offline queue | `offlineQueueStore.ts` (Zustand) | Client-only pending payments |
| UI / app lock | `uiStore.ts`, `appLockStore.ts` | Client persistence |

**P14 backend:** Replaced runtime persistence with `backend/src/db/store.ts` (in-memory) for borrowers, payments, groups, audit, uploads on disk.

## 3. Frontend-only / mock-side-effect business rules

| Rule | Evidence | Backend status |
|------|----------|----------------|
| Auto group formation on approve | `borrowerService.mock.ts:346-351` ÔåÆ `groupFormationService.mock.ts` | Ô£à `processApprovedBorrower` in backend |
| Registration approved/rejected notifications | `borrowerService.mock.ts:337-368` | ÔØî Not emitted server-side |
| Payment duplicate detection | `paymentService.mock.ts:48-55` | Ô£à `findDuplicatePayment` + 409 |
| Payment ÔåÆ loan schedule application | `paymentService.mock.ts: applyPaymentToOldestObligation` | ÔØî Not in P14 payments module |
| Overpayment review queue | `paymentService.mock.ts` + `overpaymentReviewService.mock.ts` | ÔØî |
| Loan disbursed/completed notifications | `loan-notifications.sync.ts` | ÔØî |
| Payment reminder cron | `payment-reminder.sync.ts:57-64` | ÔØî |
| Borrower escalation | `borrower-escalation.sync.ts` | ÔØî |
| Adjustment audit trail | `adjustmentService.mock.ts:126+` | ÔØî |
| Synthetic borrower profiles by ID pattern | `borrower-full-profile.builder.ts` | ÔØî Backend 404 only |

## 4. Hardcoded IDs & demo data

| Item | Evidence |
|------|----------|
| Demo users | `constants/demo-accounts.ts` ÔÇö IDs `user-super-admin`, `user-collector`, etc. |
| Backend seed | `backend/src/seed/demo-users.ts` mirrors same IDs/passwords |
| Pre-seeded pending borrowers | `backend/src/db/store.ts` ÔÇö `borrower-pending-001`, `borrower-pending-002` |
| Mock registry entries | `mocks/borrower-registry.ts` ÔÇö `borrower-001`, etc. (demo mode only) |

## 5. Service methods not yet backed by P14 API

All methods in: `loanService`, `settingsService`, `notificationService`, `searchService`, `collectorService`, `collectorManagementService`, `dashboardService`, `loanPoolService`, `groupService` (management), `riskFlagService`, `adjustmentService`, `expenseService`, `reconciliationService`, `transactionService`, `locationService`, `photoCaptureSessionService`, `collectionMetricsService`, `overpaymentReviewService`.

Stubs call `apiClient` paths documented in `P13-api-contract-map.md` ÔÇö no server handlers until subsequent P14 phases.

## 6. Integration switches

| Switch | File | Behavior |
|--------|------|----------|
| Mock vs API provider | `data-provider/types.ts:70-91` | API mode requires production + `NEXT_PUBLIC_API_BASE_URL` |
| Webpack services alias | `next.config.mjs:63-85` | Dev ÔåÆ mock; prod ÔåÆ `index.production.ts` |
| Auth path | `authenticate.ts:16-37` | Mock vs `apiClient.post('/auth/login')` |

## Incomplete work (honest)

- P14 backend uses in-memory DB, not PostgreSQL/SQLite.
- Notification, loan amortization, and full report aggregates remain mock-only.
- `simulatePhoneCapture` remains demo-only.
- E2E suite not re-run against API mode in this pass (demo mode unchanged by default).
