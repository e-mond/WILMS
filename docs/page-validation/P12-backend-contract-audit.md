# P12 Backend Contract Audit

Audit date: 2026-06-09. Provider switch: `IDataProvider` (`MockDataProvider` | `ApiDataProvider`). UI imports `@/services` only.

## Provider wiring

| Check | Status | Evidence |
|-------|--------|----------|
| `IDataProvider` includes all services | Yes | `src/data-provider/types.ts` (25 service properties incl. `uploadService`) |
| Mock provider | Yes | `src/data-provider/MockDataProvider.ts` |
| API provider | Yes | `src/data-provider/ApiDataProvider.ts` |
| Dev exports | Yes | `src/services/index.development.ts` |
| Production exports | Yes | `src/services/index.production.ts` (includes `uploadService`) |
| Next.js API routes | **Auth only** | `src/app/api/auth/login`, `logout` |

---

## Domain matrix

| Domain | Interface | Mock | API stub | DTOs | Missing contracts |
|--------|-----------|------|----------|------|-------------------|
| **Auth** | `IAuthService` | `authService.mock.ts` | `authService.ts` | `LoginInput`, `LoginResult` | Login route exists; token refresh / MFA API not defined |
| **Users** | `ISettingsService` (users) | `settingsService.mock.ts` | `settingsService.ts` | `SettingsUserRecord`, CRUD inputs in `src/types/settings.ts` | `POST/PATCH/DELETE /settings/users/*` — no routes |
| **Roles** | `ISettingsService` (roles) | same | same | `SettingsRoleRecord` | Role CRUD API routes missing |
| **Permissions** | `ISettingsService` (permissions) | same | same | `PermissionDefinition`, overrides in `src/types/rbac.ts` | Permission assignment API routes missing |
| **Borrowers** | `IBorrowerService` | `borrowerService.mock.ts` | `borrowerService.ts` | `BorrowerSummary`, `BorrowerDetail`, checks | Full `/borrowers/*` REST — no routes |
| **Registration** | `IBorrowerService` | same | same | `RegisterBorrowerPayload`, officer lists | Same as borrowers |
| **Approvals** | `IBorrowerService` | same | same | `BorrowerReviewDetail`, reject/blacklist inputs | Approve/reject API routes missing |
| **Collectors** | `ICollectorManagementService`, `ICollectorService` | both mocks | both stubs | `CollectorDetail`, dashboard types | `/collectors/*`, collector portal endpoints missing |
| **Groups** | `IGroupService` | `groupService.mock.ts` | `groupService.ts` | `GroupDetail`, mutation inputs incl. `UpdateGroupDisplayNameInput` | `/groups/*` mutations — no routes |
| **Group formation** | `IGroupFormationService` | `groupFormationService.mock.ts` | `groupFormationService.ts` | `GroupFormationStatus`, `AutoGroupCreationResult` | `/groups/formation/*` — no routes |
| **Loans** | `ILoanService` | `loanService.mock.ts` | `loanService.ts` | `LoanDetail`, `CreateLoanInput` | `/loans/*` — no routes |
| **Disbursements** | `ILoanService.disburseLoan` | same | same | `DisbursementEligibility` | Disbursement endpoint missing |
| **Collections** | `IPaymentService`, `ICollectorService` | both mocks | both stubs | `RecordPaymentInput`, payment context | Payment + reconciliation API missing |
| **Expenses** | `IExpenseService` | `expenseService.mock.ts` | `expenseService.ts` | Expense summary + entry types | `/expenses/*` missing |
| **Risk & flags** | `IRiskFlagService` | `riskFlagService.mock.ts` | `riskFlagService.ts` | `RiskFlagDetail` | `/risk-flags/*` missing |
| **Reports** | `IReportService` | `reportService.mock.ts` | `reportService.ts` | Report hub + per-report DTOs | `/reports/*` missing |
| **Notifications** | `INotificationService` | `notificationService.mock.ts` | `notificationService.ts` | `NotificationInboxItem`, delivery types | `/notifications/*` missing |
| **Audit** | `IAuditService` | `auditService.mock.ts` | `auditService.ts` | Audit entry types in `src/constants/audit.ts` | Audit log API missing |
| **Dashboard** | `IDashboardService` | `dashboardService.mock.ts` | `dashboardService.ts` | `DashboardSummary` | `/dashboard/summary` missing |
| **Search** | `ISearchService` | `searchService.mock.ts` | `searchService.ts` | `GlobalSearchResult` | `/search` missing |
| **Settings** | `ISettingsService` | `settingsService.mock.ts` | `settingsService.ts` | `SystemSettings` | `/settings` missing |
| **Uploads** | `IUploadService` | `uploadService.mock.ts` | `uploadService.ts` | `UploadFileInput`, `UploadRecord`, `UPLOAD_PURPOSE` | `/uploads/*` missing; multipart contract not specified |
| **Location** | `ILocationService` | `locationService.mock.ts` | `locationService.ts` | Location verify types | `/locations/*` missing |
| **Photo capture** | `IPhotoCaptureSessionService` | mock | stub | Session types | `/registration/capture-sessions/*` missing |
| **Adjustments** | `IAdjustmentService` | mock | stub | Adjustment types | API missing |
| **Reconciliation** | `IReconciliationService` | mock | stub | Reconciliation types | API missing |
| **Transactions (admin fee)** | `ITransactionService` | mock | stub | Fee types | API missing |
| **Overpayment review** | `IOverpaymentReviewService` | mock | stub | Review types | API missing |
| **Collection metrics** | `ICollectionMetricsService` | mock | stub | Metrics response | `/metrics/collections` missing |
| **Loan pools** | `ILoanPoolService` | mock | stub | Pool types | API missing |

---

## Upload service (new in P12)

| Purpose constant | Value |
|------------------|-------|
| Profile photos | `profile-photo` |
| Borrower photos | `borrower-photo` |
| Guarantor photos | `guarantor-photo` |
| Documents | `document` |
| Registration attachments | `registration-attachment` |

| Method | Mock | API stub |
|--------|------|----------|
| `uploadFile` | `uploadService.mock.ts` | `POST /uploads` |
| `getUpload` | in-memory store | `GET /uploads/:id` |
| `deleteUpload` | store delete | `POST /uploads/:id/delete` |

**Note:** Upload service is registered in providers but not yet consumed by registration/profile UI components (photos still use `resolvePersonPhotoUrl` / local data URLs).

---

## Contract documentation

Updated: `src/contracts/README.md` — upload endpoints and mock/API index rows added.

---

## Backend readiness score (service layer)

| Metric | Value |
|--------|-------|
| Domains with interface + mock + API stub | **25 / 25** (100% at service-contract layer) |
| Domains with Next.js route handlers | **1 / 25** (auth login/logout only ≈ **4%**) |
| Upload purposes defined | **5 / 5** |

Service-layer frontend is ready for backend integration; runtime backend is not.
