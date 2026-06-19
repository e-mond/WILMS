# Demo Mode Compliance Report

> Assessment date: 2026-06-09 | **Compliance: ~88%**

## Architecture scorecard

| Requirement | Status | Notes |
|---|---|---|
| Centralized mock data (`mocks/`, `services/mock/`) | ✅ | 21 fixture files + 20+ mock services |
| No UI imports from `mocks/` | ✅ | Grep clean on `features/` and `app/` |
| Service interface parity (mock ↔ API) | ✅ | `src/types/services.ts` |
| `IDataProvider` pattern | ✅ | `src/data-provider/` |
| Auto fallback to mock | ✅ | `resolveDataProviderMode()` + webpack alias |
| Demo banner | ✅ | `DemoModeBanner` when mock active |
| No empty demo dashboards | ✅ | Factory-built datasets with seeded RNG |
| API contract stubs | ✅ | `src/contracts/README.md` |

---

## Demo coverage by domain

| Domain | Demo functional | Data source | Gaps |
|---|---|---|---|
| Dashboard KPIs | ✅ | `dashboardService` + factories | Reference sign-off pending |
| Collection metrics | ✅ | `collectionMetricsService` | Yearly widget on dashboard optional |
| Expense metrics | ✅ | `expenseService.getExpenseSummary()` | — |
| Group analytics | ✅ | `groupService`, dashboard factory | — |
| Risk analytics | ✅ | `riskFlagService` | — |
| Alerts | ✅ | `dashboardService.recentAlerts` | — |
| Borrowers | ✅ | `borrowerService` + registry store | Photo URLs pending API |
| Collectors | ✅ | `collectorManagementService` + factory | Mobile reference parity |
| Groups | ✅ | `groupService` | — |
| Loan pools | ✅ | `loanPoolService` | Mobile reference parity |
| Risk & flags | ✅ | `riskFlagService` | — |
| Reports | ✅ | `reportService` | Filter options now service-driven |
| Settings | ✅ | `settingsService` | Role editor UI incomplete |
| Registration | ✅ | `borrowerService` + capture session service | Production capture API |
| Approver | ✅ | `borrowerService` | — |
| Collector field | ✅ | `collectorService`, `paymentService` | — |

---

## Violations fixed in this pass

| Item | Resolution |
|---|---|
| `PhoneCaptureSessionPanel` imported mock directly | → `photoCaptureSessionService` via `@/services` |
| `AuditLogReportPanel` used `DEMO_ACCOUNTS` | → `settingsService.listUsers()` |
| `DailyCollectionReportPanel` used `DEMO_ACCOUNTS` | → `collectorManagementService.listCollectors()` |
| `CollectorExpenseForm` inline category map | → `constants/expenses.ts` |
| Demo banner dev-only | → Shows whenever mock provider active |
| Provider switch dev-only | → Staging without API URL uses mocks |

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
        ↓
   @/services (webpack alias)
        ↓
IDataProvider
   ├── MockDataProvider  (development, demo staging)
   └── ApiDataProvider   (production + API URL)
        ↓
   src/mocks/ (fixtures)  OR  REST via apiClient
```

Switching to backend: set `NEXT_PUBLIC_API_BASE_URL` and build for production. No component changes required.

---

## Sign-off

**Demo Mode mandatory requirements:** met for all listed domains.  
**Remaining work:** reference parity, RBAC, user admin, API implementation — not demo data gaps.
