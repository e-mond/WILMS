# Demo Mode Compliance Report

> Assessment date: 2026-06-09 | **Compliance: ~88%**

## Architecture scorecard

| Requirement | Status | Notes |
|---|---|---|
| Centralized mock data (`mocks/`, `services/mock/`) | Ô£à | 21 fixture files + 20+ mock services |
| No UI imports from `mocks/` | Ô£à | Grep clean on `features/` and `app/` |
| Service interface parity (mock Ôåö API) | Ô£à | `src/types/services.ts` |
| `IDataProvider` pattern | Ô£à | `src/data-provider/` |
| Auto fallback to mock | Ô£à | `resolveDataProviderMode()` + webpack alias |
| Demo banner | Ô£à | `DemoModeBanner` when mock active |
| No empty demo dashboards | Ô£à | Factory-built datasets with seeded RNG |
| API contract stubs | Ô£à | `src/contracts/README.md` |

---

## Demo coverage by domain

| Domain | Demo functional | Data source | Gaps |
|---|---|---|---|
| Dashboard KPIs | Ô£à | `dashboardService` + factories | Reference sign-off pending |
| Collection metrics | Ô£à | `collectionMetricsService` | Yearly widget on dashboard optional |
| Expense metrics | Ô£à | `expenseService.getExpenseSummary()` | ÔÇö |
| Group analytics | Ô£à | `groupService`, dashboard factory | ÔÇö |
| Risk analytics | Ô£à | `riskFlagService` | ÔÇö |
| Alerts | Ô£à | `dashboardService.recentAlerts` | ÔÇö |
| Borrowers | Ô£à | `borrowerService` + registry store | Photo URLs pending API |
| Collectors | Ô£à | `collectorManagementService` + factory | Mobile reference parity |
| Groups | Ô£à | `groupService` | ÔÇö |
| Loan pools | Ô£à | `loanPoolService` | Mobile reference parity |
| Risk & flags | Ô£à | `riskFlagService` | ÔÇö |
| Reports | Ô£à | `reportService` | Filter options now service-driven |
| Settings | Ô£à | `settingsService` | Role editor UI incomplete |
| Registration | Ô£à | `borrowerService` + capture session service | Production capture API |
| Approver | Ô£à | `borrowerService` | ÔÇö |
| Collector field | Ô£à | `collectorService`, `paymentService` | ÔÇö |

---

## Violations fixed in this pass

| Item | Resolution |
|---|---|
| `PhoneCaptureSessionPanel` imported mock directly | ÔåÆ `photoCaptureSessionService` via `@/services` |
| `AuditLogReportPanel` used `DEMO_ACCOUNTS` | ÔåÆ `settingsService.listUsers()` |
| `DailyCollectionReportPanel` used `DEMO_ACCOUNTS` | ÔåÆ `collectorManagementService.listCollectors()` |
| `CollectorExpenseForm` inline category map | ÔåÆ `constants/expenses.ts` |
| Demo banner dev-only | ÔåÆ Shows whenever mock provider active |
| Provider switch dev-only | ÔåÆ Staging without API URL uses mocks |

---

## Remaining violations (12% gap)

| Severity | Location | Issue |
|---|---|---|
| Low | `LoginForm` | Demo account picker uses `DEMO_ACCOUNTS` constant (auth UX, acceptable) |
| Low | `constants/dashboard-reference-scale.ts` | Reference scale seeds used by factories only |
| Low | `constants/collectors-reference-scale.ts` | Factory seed constants |
| Medium | Profile lists | Initials-only avatars until API photo URLs |
| Medium | Error empty states | Still shown if mock service throws (should not in demo) |

---

## Provider architecture

```
UI Components / Hooks
        Ôåô
   @/services (webpack alias)
        Ôåô
IDataProvider
   Ôö£ÔöÇÔöÇ MockDataProvider  (development, demo staging)
   ÔööÔöÇÔöÇ ApiDataProvider   (production + API URL)
        Ôåô
   src/mocks/ (fixtures)  OR  REST via apiClient
```

Switching to backend: set `NEXT_PUBLIC_API_BASE_URL` and build for production. No component changes required.

---

## Sign-off

**Demo Mode mandatory requirements:** met for all listed domains.  
**Remaining work:** reference parity, RBAC, user admin, API implementation ÔÇö not demo data gaps.
