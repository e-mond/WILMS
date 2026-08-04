# Mock Data Compliance Audit (Pre-P10 v2)

Audit date: 2026-06-09  
Supersedes: `hardcoded-data-audit.md` (P4) — extends with re-scan after P7–P9 and dashboard pass.

## Compliance rule

Executive metrics, table rows, KPI totals, trend values, and report datasets must originate from:

- `src/mocks/`
- `src/services/mock/factories/`
- `src/services/mock/*.store.ts`
- Service hooks (`useDashboardSummary`, `useGroups`, etc.)

**Not permitted in feature panels:** inline arrays of business data, literal currency totals, hardcoded trend percentages.

## ✅ Compliant areas

| Module | Route | Data source |
|---|---|---|
| Super Admin Dashboard | `/dashboard` | `dashboardService` → `dashboard-demo.factory` via `useDashboardSummary` |
| Groups | `/groups`, `/groups/[id]` | `groups-demo.factory`, `groupService` |
| Collectors | `/collectors`, `/collectors/[id]` | `collectors-demo.factory`, `collectorManagementService` |
| Loan Pools | `/loan-pools` | `loanPoolService.mock` |
| Risk & Flags | `/risk-flags` | `risk-flags-demo.factory`, `buildRiskFlagListResponse` |
| Reports hub | `/reports` | `MOCK_REPORTS_HUB`, `REPORT_CATALOG`, `useReportsHubMetadata` |
| Report KPIs | `/reports` | `useDashboardSummary()` only |
| Settings users | `/settings` (Users) | `MOCK_SETTINGS_USERS`, `settings-users.store` |
| Settings activity aside | `/settings` | `MOCK_SETTINGS_ACTIVITY`, `useSettingsActivity` |
| Borrowers list | `/borrowers` | `borrowerService` registry |
| Loans portfolio | `/loans` | `loanService` |
| Adjustments | `/adjustments` | `adjustmentService` |
| Collector dashboard | `/collector/dashboard` | `collectorService.getDashboard` |
| All 9 report panels | `/reports/*` | Respective `IReportService` methods |

## ⚠️ Acceptable literals (non-metric)

| Location | Content | Rationale |
|---|---|---|
| `SuperAdminDashboard.tsx` | `QUICK_ACTIONS` route map | Static navigation chrome, not metrics |
| `constants/navigation.ts` | Nav labels + hrefs | Shell configuration |
| Settings section cards | Form default placeholders | Demo read-only UI controls |
| Export builders | Static compliance copy | Document headers; row data from service re-fetch |
| `LoginForm.tsx` | `DEMO_ACCOUNTS` picker | Dev/demo auth only |
| `WilmsBrandMark` / sidebar | Version string | Chrome, not business data |

## ❌ Violations / gaps (non-blocking for mock demo)

| Location | Issue | Severity | Remediation |
|---|---|---|---|
| `AuditLogReportPanel.tsx` | User filter options from `DEMO_ACCOUNTS` | Medium | Move to `settingsService.listUsers()` or report metadata endpoint |
| `DailyCollectionReportPanel.tsx` | Collector filter from `DEMO_ACCOUNTS` | Medium | Use `collectorManagementService.listCollectors()` |
| `utils/collector-management-list.ts` | Imports factory + `DEMO_ACCOUNTS` | Low (ADR-003) | Keep aggregation in service layer only |
| `utils/defaulter-report.ts`, similar utils | Mock store reads from utils | Low | Refactor to service-only before production cutover |
| Settings loan rules / org branding sections | Hardcoded demo field values | Low | Wire to `ISettingsService.updateSettings()` when API exists |

## Dashboard-specific verification

| Widget | Hardcoded? | Source |
|---|---|---|
| KPI amounts (pool, disbursed, collected, outstanding) | No | `data.kpis` from factory |
| KPI trend labels / direction | No | Factory-generated |
| Borrower segments | No | Factory |
| Collector performance rows | No | Factory top-5 |
| Group risk segments + total | No | Factory |
| Cycle snapshot metrics | No | Factory |
| Recent alerts | No | Factory (12 categories) |

## Scan commands

```bash
# Feature-layer inline arrays (should be empty for metrics)
rg "const (rows|kpis|metrics|alerts)\s*=\s*\[" src/features

# DEMO_ACCOUNTS outside auth/reports filters
rg "DEMO_ACCOUNTS" src/features

# Direct mock imports in features (ESLint restricted)
npm run lint
```

## Verdict

**Mock-data compliant for executive dashboard and PG-01–PG-06 pages.**  
Remaining gaps are filter dropdowns on two report panels and utils-layer mock coupling — acceptable for demo, must be resolved before backend integration (see `backend-integration-readiness.md`).
