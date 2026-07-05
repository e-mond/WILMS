# KPI Data Audit

Recorded: 2026-06-09  
Goal: 100% service-driven KPI metrics (no hardcoded business numbers in KPI cards)

## Compliance model

```
KpiCard value ÔåÆ hook/query ÔåÆ @/services ÔåÆ mock factory / API provider
```

Client-side derived KPIs (e.g. filtered row counts, `%` from service amounts) are **compliant** when the underlying dataset comes from a service.

---

## Super Admin Dashboard

| KPI | Component | Data source | Service |
|---|---|---|---|
| Pool / Disbursed / Collected / Outstanding | `SuperAdminDashboard` | `data.kpis[]` | `dashboardService.getDashboardSummary()` |
| Borrower segments | `SuperAdminDashboard` | `data.borrowerSegments` | Same |
| Group risk | `GroupRiskCard` | `data.groupRisk`, `data.totalGroups` | Same |
| Collection performance (daily/weekly/monthly) | `DashboardCollectionSummary` | `useCollectionMetrics()` | `collectionMetricsService` |
| Expense summary | `DashboardExpenseSummary` | `useDashboardSummary()` expense slice | `dashboardService` |
| Cycle snapshot | `DashboardCycleSnapshot` | Dashboard summary | `dashboardService` |
| Collector performance table | `DashboardCollectorPerformance` | Dashboard summary | `dashboardService` |

**Non-KPI (acceptable):** `QUICK_ACTIONS` constant ÔÇö navigation links only, not metrics.

**Dashboard files:** Not modified (layout preserved).

---

## Collector Dashboard

| KPI / metric tile | Component | Data source | Service |
|---|---|---|---|
| Hero amount / target / % / paid / pending / overdue | `CollectorDashboardPanel` | `hero`, `summary` | `collectorService.getDashboard()` ÔåÆ `assembleCollectorDashboard()` |
| Groups due / streak / trend / payments / rate | `CollectorDashboardPanel` | `stats`, `todayGroups` | Same |

**Status:** Pass ÔÇö refactored in P11c; no hardcoded streak/trend values.

---

## Reports

| KPI | Component | Data source | Service |
|---|---|---|---|
| Reports index KPI row | `ReportsIndexPanel` | `resolveReportKpis(dashboardSummary)` | `dashboardService` + `reportService.listReports()` |
| Daily collection | `DailyCollectionReportPanel` | Report hook data | `reportService.getDailyCollectionReport()` |
| Audit log | `AuditLogReportPanel` | Entry count + filters | `auditService` via `useAuditLogReport` |
| Loan portfolio report | `LoanPortfolioReportPanel` | Report summary | `reportService` |
| Defaulters / ledger / group risk / collector performance | Respective panels | Report hooks | `reportService` |

**Auditor portal:** Uses same report panels under `/auditor/reports` ÔÇö same service paths.

---

## Risk & Flags

| KPI | Component | Data source | Service |
|---|---|---|---|
| Open / Critical / Blacklisted / High-risk | `RiskFlagsPanel` | `data.summary.*` | `riskFlagService.listFlags()` |

---

## Groups

| KPI | Component | Data source | Service |
|---|---|---|---|
| Active / members / flagged / avg collection | `GroupsManagementPanel` | `data.summary` | `groupService.listGroups()` |
| Group profile collection rate | `GroupProfilePanel` | `data.collectionRatePercent` | `groupService.getGroupDetail()` |

---

## Borrowers

| KPI | Component | Data source | Service |
|---|---|---|---|
| Total / approved / pending / blacklisted | `BorrowerList` | `summarizeBorrowerList(data)` | `borrowerService.listBorrowers()` |
| Profile KPIs | `BorrowerProfilePanel` | `borrower`, `loans` hooks | `borrowerService`, `loanService` |

---

## Loan Pools

| KPI | Component | Data source | Service |
|---|---|---|---|
| Pool summary row | `LoanPoolsPanel` | `data.summary` | `loanPoolService.listPools()` |

---

## Registration Officer

| KPI | Component | Data source | Service |
|---|---|---|---|
| Total / approved / pending / rejected / draft | `MyRegistrationsList` | `data`, `countRegistrationsByStatus()` | `borrowerService.listOfficerRegistrations()` |

---

## Approver

| KPI | Component | Data source | Service |
|---|---|---|---|
| Pending count | `PendingApplicationsQueue` | `data.length` | `borrowerService.listPendingApplications()` |
| Showing (filtered) | Both queue panels | Client filter of service list | Same (derived, not hardcoded) |
| Reviewed count | `ReviewedApplicationsPanel` | `data.length` | `borrowerService.listReviewedApplications()` |

---

## Collectors admin

| KPI | Component | Data source | Service |
|---|---|---|---|
| List summary row | `CollectorsManagementPanel` | `data.summary` | `collectorManagementService.listCollectors()` |
| Profile KPIs | `CollectorProfilePanel` | `data.*` | `collectorManagementService.getCollector()` |

### Fixed in P11e

| Previous violation | Resolution |
|---|---|
| `Reconciliations: "12"` | `data.reconciliationCount` from collectors demo factory |
| `Expenses submitted: "8"` | `data.expensesSubmittedCount` from factory |
| `Recovery rate: collectionRatePercent + 4` | `data.recoveryRatePercent` from factory |

---

## Remaining non-KPI hardcoded content (not KPI cards)

| Location | Type | Verdict |
|---|---|---|
| `CollectorProfilePanel` sidebar lists / group table | Inline demo copy | P1 ÔÇö not KPI cards; detail panel enhancement |
| `SuperAdminDashboard` `QUICK_ACTIONS` | Nav config | Acceptable |

---

## Sign-off

**KPI cards:** 100% service-driven after P11e collector profile fix.  
**Dashboard layouts:** Unchanged.
