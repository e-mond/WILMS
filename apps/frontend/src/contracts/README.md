# WILMS API Contracts — Demo Mode / Backend Integration

> Each mock service method maps to a REST contract. Types live in `src/types/`.  
> Switch providers via `IDataProvider` (`MockDataProvider` | `ApiDataProvider`).

## Provider switching

| Condition | Provider | Banner |
|---|---|---|
| `NODE_ENV !== 'production'` | Mock | Demo Mode Active |
| `NEXT_PUBLIC_API_BASE_URL` empty | Mock | Demo Mode Active |
| `NEXT_PUBLIC_API_DISABLED=true` | Mock | Demo Mode Active |
| `NEXT_PUBLIC_FORCE_DEMO_MODE=true` | Mock | Demo Mode Active |
| Production + API URL configured | API | Hidden |

Env vars:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.wilms.example
NEXT_PUBLIC_API_DISABLED=false
NEXT_PUBLIC_FORCE_DEMO_MODE=false
```

---

## Core contracts

### Dashboard — `GET /dashboard/summary`

Response: `DashboardSummary` (`src/types/dashboard.ts`)

### Collection metrics — `GET /metrics/collections?period=DAILY|WEEKLY|MONTHLY|YEARLY`

Response: `CollectionMetricsResponse`

### Expenses — `GET /expenses/summary`

Response: `{ todayPesewas, weekPesewas, monthPesewas, yearPesewas }`

### Borrowers — `GET /borrowers`, `POST /borrowers`, `GET /borrowers/:id/full-profile`

Payload: `RegisterBorrowerPayload`  
Validation: phone/id uniqueness, blacklist, guarantor eligibility

### Guarantor eligibility — `POST /borrowers/check-guarantor-eligibility`

Request: `GuarantorEligibilityInput`  
Response: `GuarantorEligibilityResult`

### Photo capture — `POST /registration/capture-sessions`, `GET /registration/capture-sessions/:token`

See `context/docs/archive/page-validation/phone-capture-integration.md`

### Uploads — `POST /uploads`, `GET /uploads/:id`, `POST /uploads/:id/delete`

Request: `UploadFileInput` (`src/types/upload.ts`)  
Response: `UploadRecord`  
Purposes: `profile-photo`, `borrower-photo`, `guarantor-photo`, `document`, `registration-attachment`

### Collectors — `GET /collectors`, `GET /collectors/:id`

Response: `CollectorListResponse`, `CollectorDetail`

### Groups — `GET /groups`, `GET /groups/:id`

Response: `GroupListResponse`, `GroupDetail`

### Loan pools — `GET /loan-pools`, `GET /loan-pools/:id`

Response: `LoanPoolListResponse`, `LoanPoolDetail`

### Risk flags — `GET /risk-flags`, `GET /risk-flags/:id`

Response: `RiskFlagListResponse`, `RiskFlagDetail`

### Reports — `GET /reports/hub`, `GET /reports/daily-collection`, etc.

Params documented per hook in `src/features/reports/hooks/`

### Settings — `GET /settings`, `GET /settings/users`, `GET /settings/roles`, `GET /settings/permissions`

Registration legal: `GET /settings/registration-legal` → `RegistrationLegalConfig`

### Auth — `POST /api/auth/login`

Request: `LoginInput` → `LoginResult`

---

## Validation rules (shared)

- Ghana phone: `+233` or `0` + 9 digits
- Financial amounts in pesewas (integer)
- GPS required on payment mutations (service layer)
- No client-supplied acting user ID on approvals

---

## Mock service index

| Interface | Mock | API |
|---|---|---|
| `IDashboardService` | `dashboardService.mock.ts` | `dashboardService.ts` |
| `IBorrowerService` | `borrowerService.mock.ts` | `borrowerService.ts` |
| `ICollectorManagementService` | `collectorManagementService.mock.ts` | `collectorManagementService.ts` |
| `IGroupService` | `groupService.mock.ts` | `groupService.ts` |
| `ILoanPoolService` | `loanPoolService.mock.ts` | `loanPoolService.ts` |
| `IRiskFlagService` | `riskFlagService.mock.ts` | `riskFlagService.ts` |
| `IReportService` | `reportService.mock.ts` | `reportService.ts` |
| `ISettingsService` | `settingsService.mock.ts` | `settingsService.ts` |
| `IExpenseService` | `expenseService.mock.ts` | `expenseService.ts` |
| `ICollectionMetricsService` | `collectionMetricsService.mock.ts` | `collectionMetricsService.ts` |
| `IPhotoCaptureSessionService` | `photoCaptureSessionService.mock.ts` | `photoCaptureSessionService.ts` |
| `IUploadService` | `uploadService.mock.ts` | `uploadService.ts` |
| `IGroupFormationService` | `groupFormationService.mock.ts` | `groupFormationService.ts` |

Static fixtures: `src/mocks/` (data only, no UI imports).
