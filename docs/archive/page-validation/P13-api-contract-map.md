# P13 API Contract Map

Backend handoff document. Generated from `src/types/services.ts` interfaces, `src/services/*.ts` API providers, and `src/services/mock/*.mock.ts` mock providers.

Provider selection: `MockDataProvider` (demo) vs `ApiDataProvider` (production) in `src/data-provider/`.

Auth note: `IAuthService.login` uses Next.js route `POST /api/auth/login` (not `apiClient` base URL).

---

## 1. Auth

| | |
|---|---|
| **Interface** | `IAuthService` |
| **Mock** | `authService.mock.ts` (demo users) |
| **API** | `authService.ts` → `POST /api/auth/login` |
| **Request** | `LoginInput`: `{ email, password }` |
| **Response** | `LoginResult`: user session + role + permissions |

---

## 2. Borrowers

| | |
|---|---|
| **Interface** | `IBorrowerService` |
| **Mock** | `borrowerService.mock.ts` |
| **API** | `borrowerService.ts` |
| **DTOs** | `BorrowerSummary`, `BorrowerDetail`, `BorrowerFullProfile`, `RegisterBorrowerPayload`, `RejectBorrowerInput`, `BlacklistBorrowerInput`, conflict check types |

| Method | HTTP | Path | Request | Response |
|--------|------|------|---------|----------|
| listBorrowers | GET | `/borrowers` | — | `BorrowerSummary[]` |
| listMyRegistrations | GET | `/borrowers/my-registrations?officerId=` | query | `OfficerRegistrationSummary[]` |
| listPendingApplications | GET | `/borrowers?status=PENDING` | — | `PendingApplicationSummary[]` |
| listReviewedApplications | GET | `/borrowers/reviewed?approverId=` | query | `ReviewedApplicationSummary[]` |
| getBorrower | GET | `/borrowers/:id` | — | `BorrowerDetail` |
| getBorrowerFullProfile | GET | `/borrowers/:id/full-profile` | — | `BorrowerFullProfile` |
| getBorrowerReview | GET | `/borrowers/:id/review` | — | `BorrowerReviewDetail` |
| approveBorrower | PATCH | `/borrowers/:id/approve` | `{}` | `BorrowerSummary` |
| rejectBorrower | PATCH | `/borrowers/:id/reject` | `RejectBorrowerInput` | `BorrowerSummary` |
| blacklistBorrower | PATCH | `/borrowers/:id/blacklist` | `BlacklistBorrowerInput` | `BorrowerSummary` |
| registerBorrower | POST | `/borrowers` | `RegisterBorrowerPayload` | `BorrowerSummary` |
| deleteRegistration | — | **Mock only** | API stub rejects | `void` |
| checkPhone | GET | `/borrowers/check-phone?phone=` | query | `PhoneCheckResult` |
| checkId | GET | `/borrowers/check-id?idType=&idNumber=` | query | `IdCheckResult` |
| checkName | GET | `/borrowers/check-name?fullName=` | query | `SimilarNameCheckResult` |
| checkActiveLoan | GET | `/borrowers/check-active-loan?phone=` | query | `ActiveLoanCheckResult` |
| checkBlacklist | GET | `/borrowers/check-blacklist?...` | query | `BlacklistCheckResult` |
| checkGuarantorEligibility | POST | `/borrowers/check-guarantor-eligibility` | `GuarantorEligibilityInput` | `GuarantorEligibilityResult` |

---

## 3. Loans

| | |
|---|---|
| **Interface** | `ILoanService` |
| **Mock** | `loanService.mock.ts` |
| **API** | `loanService.ts` |
| **DTOs** | `LoanSummary`, `LoanDetail`, `CreateLoanInput`, `LoanPortfolioEntry`, `LoanSchedule`, etc. |

| Method | HTTP | Path | Response |
|--------|------|------|----------|
| listLoans | GET | `/loans` | `LoanSummary[]` |
| listPortfolioEntries | GET | `/loans/portfolio` | `LoanPortfolioEntry[]` |
| listActiveLoans | GET | `/loans?status=ACTIVE` | `LoanSummary[]` |
| listEligibleBorrowers | GET | `/borrowers/loan-eligible` | `LoanEligibleBorrower[]` |
| getLoan | GET | `/loans/:id` | `LoanDetail` |
| getLoanSchedule | GET | `/loans/:loanId/schedule` | `LoanSchedule` |
| listBorrowerLoans | GET | `/borrowers/:borrowerId/loans` | `BorrowerLoanHistoryEntry[]` |
| getLoanProgress | GET | `/loans/:loanId/progress` | `LoanProgressSummary` |
| listLoanPaymentLog | GET | `/loans/:loanId/payments` | `LoanPaymentLogEntry[]` |
| createLoan | POST | `/loans` | `CreateLoanInput` → `LoanDetail` |
| disburseLoan | POST | `/loans/:loanId/disburse` | `LoanDetail` |
| getDisbursementEligibility | GET | `/borrowers/:borrowerId/disbursement-eligibility` | `DisbursementEligibility` |

---

## 4. Payments

| | |
|---|---|
| **Interface** | `IPaymentService` |
| **Mock** | `paymentService.mock.ts` |
| **API** | `paymentService.ts` |

| Method | HTTP | Path | Request | Response |
|--------|------|------|---------|----------|
| getPaymentEntryContext | GET | `/borrowers/:borrowerId/payment-entry?referenceDate=` | query | `PaymentEntryContext` |
| getSameDayPayment | GET | `/payments/same-day?...` | query | `PaymentTransaction \| null` |
| recordPayment | POST | `/payments` | `RecordPaymentInput` | `PaymentTransaction` |
| editPayment | PATCH | `/payments/:paymentId` | `EditPaymentInput` | `PaymentTransaction` |

---

## 5. Transactions (Admin Fee)

| | |
|---|---|
| **Interface** | `ITransactionService` |
| **Mock** | `transactionService.mock.ts` |
| **API** | `transactionService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| recordAdminFee | POST | `/transactions/admin-fee` |
| getAdminFeeStatus | GET | `/borrowers/:borrowerId/admin-fee-status` |
| listBorrowersAwaitingAdminFee | GET | `/borrowers/awaiting-admin-fee` |

---

## 6. Groups

| | |
|---|---|
| **Interface** | `IGroupService` |
| **Mock** | `groupService.mock.ts` |
| **API** | `groupService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| listGroups | GET | `/groups` |
| getGroup | GET | `/groups/:id` |
| flagGroup | POST | `/groups/:groupId/flag` |
| reassignCollector | POST | `/groups/:groupId/reassign-collector` |
| validateMembershipRemoval | POST | `/groups/:groupId/validate-removal` |
| removeMember | POST | `/groups/:groupId/remove-member` |
| addMember | POST | `/groups/:groupId/add-member` |
| transferMember | POST | `/groups/:groupId/transfer-member` |
| replaceLeader | POST | `/groups/:groupId/replace-leader` |
| updateDisplayName | POST | `/groups/:groupId/display-name` |
| recordAdjustment | POST | `/groups/:groupId/record-adjustment` |

---

## 7. Group Formation

| | |
|---|---|
| **Interface** | `IGroupFormationService` |
| **Mock** | `groupFormationService.mock.ts` |
| **API** | `groupFormationService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| getConfig | GET | `/groups/formation/config` |
| getCommunityStatus | GET | `/groups/formation/status/:community` |
| processApprovedBorrower | POST | `/groups/formation/process-approval` |

---

## 8. Collectors

| | |
|---|---|
| **Interface** | `ICollectorService`, `ICollectorManagementService` |
| **Mock** | `collectorService.mock.ts`, `collectorManagementService.mock.ts` |
| **API** | `collectorService.ts`, `collectorManagementService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| getDashboard | GET | `/collector/:collectorId/dashboard?date=` |
| listAssignedBorrowers | GET | `/collector/:collectorId/borrowers?date=` |
| listCollectors | GET | `/collectors` |
| getCollector | GET | `/collectors/:id` |

---

## 9. Expenses

| | |
|---|---|
| **Interface** | `IExpenseService` |
| **Mock** | `expenseService.mock.ts` |
| **API** | `expenseService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| listExpenses | GET | `/expenses` |
| createExpense | POST | `/expenses` |
| reviewExpense | PATCH | `/expenses/:id` |
| getExpenseSummary | GET | `/expenses/summary` |

---

## 10. Reconciliation

| | |
|---|---|
| **Interface** | `IReconciliationService` |
| **Mock** | `reconciliationService.mock.ts` |
| **API** | `reconciliationService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| getCollectorReconciliation | GET | `/reconciliation?collectorId=&date=` |
| submitReconciliation | POST | `/reconciliations` |

---

## 11. Adjustments

| | |
|---|---|
| **Interface** | `IAdjustmentService` |
| **Mock** | `adjustmentService.mock.ts` |
| **API** | `adjustmentService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| listPendingAdjustments | GET | `/adjustments/pending` |
| createAdjustment | POST | `/adjustments` |
| approveAdjustment | POST | `/adjustments/:id/approve` |
| rejectAdjustment | POST | `/adjustments/:id/reject` |

---

## 12. Overpayment Reviews

| | |
|---|---|
| **Interface** | `IOverpaymentReviewService` |
| **Mock** | `overpaymentReviewService.mock.ts` |
| **API** | `overpaymentReviewService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| listPendingReviews | GET | `/overpayment-reviews/pending` |
| queueReview | POST | `/overpayment-reviews` |
| resolveReview | POST | `/overpayment-reviews/:id/resolve` |

---

## 13. Risk Flags

| | |
|---|---|
| **Interface** | `IRiskFlagService` |
| **Mock** | `riskFlagService.mock.ts` |
| **API** | `riskFlagService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| listRiskFlags | GET | `/risk-flags` |
| getRiskFlag | GET | `/risk-flags/:id` |

---

## 14. Reports

| | |
|---|---|
| **Interface** | `IReportService` |
| **Mock** | `reportService.mock.ts` |
| **API** | `reportService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| listAvailableReports | GET | `/reports` |
| getReportsHubMetadata | GET | `/reports/hub` |
| getLoanPortfolioReport | GET | `/reports/loan-portfolio?...` |
| getDailyCollectionReport | GET | `/reports/daily-collection?...` |
| getDefaulterReport | GET | `/reports/defaulters` |
| getCollectorPerformanceReport | GET | `/reports/collector-performance` |
| getGroupRiskReport | GET | `/reports/group-risk` |
| getFinancialLedgerReport | GET | `/reports/financial-ledger?...` |

---

## 15. Dashboard & Metrics

| | |
|---|---|
| **Interface** | `IDashboardService`, `ICollectionMetricsService` |
| **Mock** | `dashboardService.mock.ts`, `collectionMetricsService.mock.ts` |
| **API** | `dashboardService.ts`, `collectionMetricsService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| getDashboardSummary | GET | `/dashboard/summary` |
| getMetrics | GET | `/analytics/collections?...` |

---

## 16. Loan Pools

| | |
|---|---|
| **Interface** | `ILoanPoolService` |
| **Mock** | `loanPoolService.mock.ts` |
| **API** | `loanPoolService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| listLoanPools | GET | `/loan-pools` |
| getLoanPool | GET | `/loan-pools/:id` |

---

## 17. Settings & Users

| | |
|---|---|
| **Interface** | `ISettingsService` |
| **Mock** | `settingsService.mock.ts` |
| **API** | `settingsService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| getSettings | GET | `/settings` |
| updateSettings | PATCH | `/settings` |
| listUsers | GET | `/settings/users` |
| getUserProfile | GET | `/settings/users/:userId/profile` |
| getSettingsActivity | GET | `/settings/activity` |
| listPermissions | GET | `/settings/permissions` |
| listRoles | GET | `/settings/roles` |
| createRole | POST | `/settings/roles` |
| updateRole | PATCH | `/settings/roles/:id` |
| deleteRole | POST | `/settings/roles/:id/delete` |
| cloneRole | POST | `/settings/roles/:id/clone` |
| createUser | POST | `/settings/users` |
| updateUser | PATCH | `/settings/users/:id` |
| disableUser | POST | `/settings/users/:id/disable` |
| activateUser | POST | `/settings/users/:id/activate` |
| deleteUser | POST | `/settings/users/:id/delete` |
| getRegistrationLegalConfig | GET | `/settings/registration-legal` |

---

## 18. Notifications

| | |
|---|---|
| **Interface** | `INotificationService` |
| **Mock** | `notificationService.mock.ts` |
| **API** | `notificationService.ts` |

| Method | HTTP | Path | Request | Response |
|--------|------|------|---------|----------|
| listInbox | GET | `/notifications/inbox` | — | `NotificationInboxItem[]` |
| getUnreadCount | GET | `/notifications/inbox/unread-count` | — | `number` |
| markAsRead | PATCH | `/notifications/:id/read` | `{}` | `void` |
| sendNotification | POST | `/notifications` | `SendNotificationInput` | `NotificationDelivery` |
| sendSupervisorAlert | POST | `/notifications/supervisor-alert` | `SupervisorAlertInput` | `void` |

---

## 19. Audit

| | |
|---|---|
| **Interface** | `IAuditService` |
| **Mock** | `auditService.mock.ts` + `audit-log.store.ts` |
| **API** | `auditService.ts` |

| Method | HTTP | Path | Request | Response |
|--------|------|------|---------|----------|
| createEntry | POST | `/audit` | `CreateAuditEntryInput` | `AuditEntry` |
| listRecentEntries | GET | `/audit-log?limit=&action=&actorId=&fromDate=&toDate=` | query | `AuditEntry[]` |

---

## 20. Search

| | |
|---|---|
| **Interface** | `ISearchService` |
| **Mock** | `searchService.mock.ts` |
| **API** | `searchService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| globalSearch | GET | `/search?q=&types=&limit=` |

---

## 21. Uploads

| | |
|---|---|
| **Interface** | `IUploadService` |
| **Mock** | `uploadService.mock.ts` + `upload.store.ts` |
| **API** | `uploadService.ts` |
| **DTOs** | `UploadFileInput`, `UploadRecord`, `UPLOAD_PURPOSE` |

| Method | HTTP | Path | Request | Response |
|--------|------|------|---------|----------|
| uploadFile | POST | `/uploads` | `UploadFileInput` (includes optional `dataUrl`) | `UploadRecord` |
| getUpload | GET | `/uploads/:id` | — | `UploadRecord` |
| deleteUpload | POST | `/uploads/:id/delete` | `{}` | `void` |

---

## 22. Photo Capture Sessions

| | |
|---|---|
| **Interface** | `IPhotoCaptureSessionService` |
| **Mock** | `photoCaptureSessionService.mock.ts` |
| **API** | `photoCaptureSessionService.ts` |

| Method | HTTP | Path | Notes |
|--------|------|------|-------|
| createSession | POST | `/registration/capture-sessions` | |
| getSession | GET | `/registration/capture-sessions/:token` | |
| simulatePhoneCapture | — | **Mock only** | API rejects |

---

## 23. Locations

| | |
|---|---|
| **Interface** | `ILocationService` |
| **Mock** | `locationService.mock.ts` |
| **API** | `locationService.ts` |

| Method | HTTP | Path |
|--------|------|------|
| getRegions | GET | `/locations/regions` |
| getDistricts | GET | `/locations/regions/:regionId/districts` |
| getCities | GET | `/locations/districts/:districtId/cities` |
| getCurrentLocation | GET | `/locations/current` |

---

## Mock-only / API stub gaps

| Capability | Demo | API provider |
|------------|------|--------------|
| `deleteRegistration` | Mock implements | `borrowerService.ts` L83–86 rejects |
| `simulatePhoneCapture` | Mock implements | `photoCaptureSessionService.ts` L13–15 rejects |
| Upload multipart | Mock uses base64 data URL | Backend should define multipart contract |

---

## Backend implementation priority

1. **Auth** — `/api/auth/login`, session cookies (existing Next route stub)
2. **Borrowers + registration** — full CRUD, conflict checks, approval workflow
3. **Payments + reconciliation** — collector daily operations
4. **Notifications + audit** — inbox persistence, audit log append
5. **Uploads** — file storage with URL resolution on entity DTOs
6. **Settings/users/roles** — admin portal
7. **Reports** — read-only aggregations

All TypeScript DTOs live under `src/types/` — backend should mirror field names for seamless `ApiDataProvider` swap.
