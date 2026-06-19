# Export Location Guide

Recorded: 2026-06-09  
Purpose: Maintenance map for all WILMS export entry points.

## Framework paths (shared)

| Layer | Path |
|---|---|
| UI component (full export) | `src/features/export/components/WilmsExportActions.tsx` |
| UI component (CSV-only) | `src/features/export/components/ExportCsvButton.tsx` |
| Re-export (reports) | `src/features/reports/components/ExportCsvButton.tsx` |
| Toolbar wrapper | `src/components/layout/executive/ManagementToolbar.tsx` |
| Tabular document builder | `src/features/export/builders/tabular-export-document.ts` |
| Borrower profile builder | `src/features/export/builders/borrower-profile-document.ts` |
| Group profile builder | `src/features/export/builders/group-profile-document.ts` |
| Risk flags builder | `src/features/export/builders/risk-flags-document.ts` |
| Registration agreement builder | `src/features/export/builders/registration-agreement-document.ts` |
| Settings builder | `src/features/export/builders/settings-document.ts` |
| CSV engine | `src/features/export/engines/csv-engine.ts` |
| Excel engine | `src/features/export/engines/excel-engine.ts` |
| PDF engine | `src/features/export/engines/pdf-engine.ts` |
| Print engine / HTML template | `src/features/export/engines/print-engine.ts` (`buildWilmsPrintHtml`) |
| Branding constants | `src/features/export/constants/branding.ts` |
| Report ID utility | `src/features/export/utils/report-id.ts` |
| Actor hook | `src/features/export/hooks/useWilmsExportActor.ts` |
| On-screen registration print layout | `src/features/borrower-registration/components/RegistrationAgreementDocument.tsx` |

**Note:** There is no `ExportToolbar` component in the codebase. Exports are placed via `ManagementToolbar.actions`, page headers, or inline action rows.

---

## Dashboard & Reports

### Reports index (`/reports`)

| Item | Path |
|---|---|
| Page | `src/app/(super-admin)/reports/page.tsx` |
| Panel | `src/features/reports/components/ReportsIndexPanel.tsx` |
| Export UI | `WilmsExportActions` in `ManagementToolbar.actions` |
| Document builder | `buildTabularExportDocument()` (in-panel) |
| Data service | `reportService.listReports()` + `dashboardService.getSummary()` |
| CSV / Excel / PDF / Print | All via `WilmsExportActions` → engines |

### Daily collection (`/reports/daily-collection`)

| Item | Path |
|---|---|
| Panel | `src/features/reports/components/DailyCollectionReportPanel.tsx` |
| Export UI | `ExportCsvButton` in `ManagementToolbar.actions` |
| Document builder | `buildTabularExportDocument()` (inside `ExportCsvButton`) |
| Data service | `reportService.getDailyCollectionReport()` |
| CSV only | `csv-engine.ts` |

### Audit log report (`/reports/audit-log`)

| Item | Path |
|---|---|
| Panel | `src/features/reports/components/AuditLogReportPanel.tsx` |
| Export UI | `ExportCsvButton` |
| Data service | `auditService` via `useAuditLogReport` |
| CSV only | `csv-engine.ts` |

### Loan portfolio report (`/reports/loan-portfolio`)

| Item | Path |
|---|---|
| Panel | `src/features/reports/components/LoanPortfolioReportPanel.tsx` |
| Export UI | `ExportCsvButton` |
| Data service | `loanService` / report hooks |
| CSV only | `csv-engine.ts` |

### Group risk report (`/reports/group-risk`)

| Item | Path |
|---|---|
| Panel | `src/features/reports/components/GroupRiskReportPanel.tsx` |
| Export UI | `ExportCsvButton` |
| CSV only | `csv-engine.ts` |

### Defaulters (`/reports/defaulters`)

| Item | Path |
|---|---|
| Panel | `src/features/reports/components/DefaulterReportPanel.tsx` |
| Export UI | `ExportCsvButton` |
| CSV only | `csv-engine.ts` |

### Collector performance (`/reports/collector-performance`)

| Item | Path |
|---|---|
| Panel | `src/features/reports/components/CollectorPerformanceReportPanel.tsx` |
| Export UI | `ExportCsvButton` |
| CSV only | `csv-engine.ts` |

### Financial ledger (`/reports/financial-ledger`)

| Item | Path |
|---|---|
| Panel | `src/features/reports/components/FinancialLedgerReportPanel.tsx` |
| Export UI | `ExportCsvButton` |
| Data service | `transactionService` via hooks |
| CSV only | `csv-engine.ts` |

---

## Borrowers

### Borrower list (`/borrowers`)

| Item | Path |
|---|---|
| Panel | `src/features/borrower-management/components/BorrowerList.tsx` |
| Export UI | `ExportCsvButton` in `ManagementToolbar.actions` |
| Document builder | `buildTabularExportDocument()` (inside button) |
| Data service | `borrowerService.listBorrowers()` via `useBorrowers` |
| CSV only | `csv-engine.ts` |

### Borrower profile (`/borrowers/[id]`)

| Item | Path |
|---|---|
| Actions | `src/features/borrower-management/components/BorrowerProfileActions.tsx` |
| Export UI | Inline `Button` group (not `WilmsExportActions`) |
| Document builder | `buildBorrowerProfileExportDocument()` |
| Data service | `borrowerService`, `loanService` (profile hooks) |
| CSV | `csv-engine.ts` |
| Excel | `excel-engine.ts` |
| PDF | `pdf-engine.ts` |
| Print | `print-engine.ts` (full / loan-summary / payment-history variants) |

---

## Groups

### Groups list (`/groups`)

| Item | Path |
|---|---|
| Panel | `src/features/group-management/components/GroupsManagementPanel.tsx` |
| Export UI | `ExportCsvButton` in `ManagementToolbar.actions` |
| Data service | `groupService.listGroups()` |
| CSV only | `csv-engine.ts` |

### Group profile (`/groups/[id]`)

| Item | Path |
|---|---|
| Actions | `src/features/group-management/components/GroupProfileActions.tsx` |
| Export UI | `WilmsExportActions` inline (no `ManagementToolbar`) |
| Document builder | `buildGroupProfileExportDocument()` |
| Utility wrapper | `src/utils/export-group-profile.ts` |
| Data service | `groupService.getGroupDetail()` |
| All formats | CSV, Excel, PDF, Print via `WilmsExportActions` |

---

## Collectors

### Collectors list (`/collectors`)

| Item | Path |
|---|---|
| Panel | `src/features/collector-management/components/CollectorsManagementPanel.tsx` |
| Export UI | `ExportCsvButton` in `ManagementToolbar.actions` |
| Data service | `collectorManagementService.listCollectors()` |
| CSV only | `csv-engine.ts` |

### Collector profile (`/collectors/[id]`)

| Item | Path |
|---|---|
| Panel | `src/features/collector-management/components/CollectorProfilePanel.tsx` |
| Export UI | None (no export actions on detail page) |

---

## Loan Pools & Disbursements

### Loan pools (`/loan-pools`)

| Item | Path |
|---|---|
| Panel | `src/features/loan-pools/components/LoanPoolsPanel.tsx` |
| Export UI | `ExportCsvButton` in `ManagementToolbar.actions` |
| Data service | `loanPoolService.listPools()` |
| CSV only | `csv-engine.ts` |

### Disbursements / loans (`/loans`)

| Item | Path |
|---|---|
| Panel | `src/features/loan-management/components/LoanPortfolioList.tsx` |
| Export UI | `ExportCsvButton` in `ManagementToolbar.actions` |
| Data service | `loanService.listLoans()` |
| CSV only | `csv-engine.ts` |

---

## Risk & Flags (`/risk-flags`)

| Item | Path |
|---|---|
| Panel | `src/features/risk-flags/components/RiskFlagsPanel.tsx` |
| Export UI | `WilmsExportActions` + Raise Flag button in `ManagementToolbar.actions` |
| Document builder | `buildRiskFlagsExportDocument()` |
| Data service | `riskFlagService.listFlags()` |
| All formats | CSV, Excel, PDF, Print |

---

## Registration Officer

### My registrations (`/officer/my-registrations`)

| Item | Path |
|---|---|
| Panel | `src/features/borrower-registration/components/MyRegistrationsList.tsx` |
| Export UI | `WilmsExportActions` in `ManagementToolbar.actions` |
| Document builder | `buildTabularExportDocument()` |
| Data service | `borrowerService.listOfficerRegistrations()` |
| All formats | CSV, Excel, PDF, Print |

### Registration review (wizard step)

| Item | Path |
|---|---|
| Panel | `src/features/borrower-registration/components/RegistrationReviewPanel.tsx` |
| Export UI | `WilmsExportActions` top-right of section header |
| Document builder | `buildRegistrationAgreementExportDocument()` |
| On-screen print layout | `RegistrationAgreementDocument.tsx` |
| Data service | `settingsService.getRegistrationLegalConfig()` |
| All formats | CSV, Excel, PDF, Print |

---

## Approver

### Pending application review (`/approver/pending/[id]`)

| Item | Path |
|---|---|
| Panel | `src/features/approval-workflow/components/PendingApplicationReview.tsx` |
| Export UI | `WilmsExportActions` in page header row (not `ManagementToolbar`) |
| Document builder | `buildTabularExportDocument()` |
| Data service | `borrowerService.getPendingApplicationDetail()` |
| All formats | CSV, Excel, PDF, Print |

### Pending / reviewed queues

| Item | Path |
|---|---|
| Pending queue | `PendingApplicationsQueue.tsx` — no export |
| Reviewed queue | `ReviewedApplicationsPanel.tsx` — no export |

---

## Collector portal

| Route | Export |
|---|---|
| Dashboard | None |
| My borrowers | None |
| Admin fee / payment / reconcile / expenses | None |

Collector pages do not expose export actions in the current build.

---

## Super Admin dashboard (`/dashboard`)

No export toolbar on the dashboard itself. Exports live on linked management/report pages.

---

## Export component inventory

| Component | File | Used on |
|---|---|---|
| `WilmsExportActions` | `features/export/components/WilmsExportActions.tsx` | Reports index, My Registrations, Risk & Flags, Group profile, Registration review, Approver review |
| `ExportCsvButton` | `features/export/components/ExportCsvButton.tsx` | Borrowers, Groups, Collectors, Loan Pools, Loans, all report drill-downs |
| `BorrowerProfileActions` | `features/borrower-management/components/BorrowerProfileActions.tsx` | Borrower profile (custom button row) |
| `ManagementToolbar` | `components/layout/executive/ManagementToolbar.tsx` | Wraps search/filters + export on list/report pages |
