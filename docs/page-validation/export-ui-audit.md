# Export UI Audit

Recorded: 2026-06-09  
Scope: Export toolbar/container presentation across management and report pages

---

## Root cause: oversized export container

### Primary culprit — `ManagementToolbar`

**File:** `src/components/layout/executive/ManagementToolbar.tsx`

The export actions were not oversized on their own. They were wrapped inside a **full card container** that also held search and filters:

| Previous styling | Effect |
|---|---|
| `bg-card` | Entire search + filter + export row rendered as a heavy card |
| `p-wilms-4` | Excessive padding around all toolbar content |
| `rounded-sm border border-border` | Card-like box unrelated to executive action bars |
| `actions` slot `w-full` | Export buttons stretched to full width on mobile, stacking 4+ buttons vertically |

This matched the reported issue: *large standalone card*, *full-width export panel*, *unnecessary whitespace*.

**Verdict:** The oversized export **container** comes from **`ManagementToolbar` page-level wrappers**, not from `WilmsExportActions` alone.

### Secondary contributor — `WilmsExportActions`

**File:** `src/features/export/components/WilmsExportActions.tsx`

Four secondary buttons (`Export CSV`, `Export Excel`, `Print`, `Download PDF`) with optional icons expanded the actions column height when wrapped inside the card toolbar, especially below 640px.

**Verdict:** Button count and label length amplified the toolbar height; fix applied at both toolbar and button-group level.

### Not the source

| Component | Exists? | Role |
|---|---|---|
| `ExportToolbar` | **No** | Not in codebase |
| `WilmsExportActions` | Yes | Compact button group only — no card wrapper |
| Page-level KPI sections | N/A | Separate from export; dashboards untouched |

---

## Fix applied (P11d)

### 1. `ManagementToolbar` — reduced footprint

- Removed card background (`bg-card`), rounded border box, and heavy padding
- Replaced with **bottom-border toolbar**: `border-b border-border/80 pb-wilms-3`
- Actions align **top-right** on desktop: `sm:justify-end lg:ml-auto lg:w-auto`
- Mobile touch targets preserved: `[&_button]:min-h-[44px] sm:[&_button]:min-h-8`

### 2. `WilmsExportActions` — compact responsive group

- Tighter gap (`gap-wilms-1.5`)
- **Mobile:** horizontal action strip with `overflow-x-auto` and abbreviated labels (CSV / Excel / Print / PDF)
- **Desktop:** full labels, right-aligned wrap
- Removed invalid `loading` prop on `Button` (type-check fix)
- `role="group"` + `aria-label="Export actions"`

### 3. `ExportCsvButton`

- Removed invalid `loading` prop; uses `aria-busy` + label change

---

## Placement standard compliance

| Breakpoint | Expected | After fix |
|---|---|---|
| Desktop | Top-right compact button group | Pass — actions in toolbar right column |
| Tablet | Wrapped action group | Pass — `sm:flex-wrap sm:justify-end` |
| Mobile | Horizontal strip or overflow | Pass — scrollable strip, not full-width card |
| NOT allowed | Large standalone export cards | Pass — card wrapper removed |

---

## Pages audited

| Page | Container | Export component | Status |
|---|---|---|---|
| Reports index | `ManagementToolbar` | `WilmsExportActions` | Fixed |
| My Registrations | `ManagementToolbar` | `WilmsExportActions` | Fixed |
| Risk & Flags | `ManagementToolbar` | `WilmsExportActions` + Raise Flag | Fixed |
| Borrowers list | `ManagementToolbar` | `ExportCsvButton` | Fixed |
| Groups list | `ManagementToolbar` | `ExportCsvButton` | Fixed |
| Collectors list | `ManagementToolbar` | `ExportCsvButton` | Fixed |
| Loan Pools | `ManagementToolbar` | `ExportCsvButton` | Fixed |
| Loans / Disbursements | `ManagementToolbar` | `ExportCsvButton` | Fixed |
| Report drill-downs (7) | `ManagementToolbar` | `ExportCsvButton` | Fixed |
| Group profile | Inline flex row | `WilmsExportActions` | Already compact |
| Borrower profile | Inline flex row | Custom buttons | Acceptable — separate follow-up for 6-button row |
| Registration review | Section header | `WilmsExportActions` | Already top-right |
| Approver review | Page header | `WilmsExportActions` | Already top-right |
| Super Admin dashboard | N/A | No exports | **Not modified** |
| Collector dashboard | N/A | No exports | **Not modified** |

---

## Export-related components — full list

| Component | Path | Consumers |
|---|---|---|
| `WilmsExportActions` | `src/features/export/components/WilmsExportActions.tsx` | ReportsIndexPanel, MyRegistrationsList, RiskFlagsPanel, GroupProfileActions, RegistrationReviewPanel, PendingApplicationReview |
| `ExportCsvButton` | `src/features/export/components/ExportCsvButton.tsx` | BorrowerList, GroupsManagementPanel, CollectorsManagementPanel, LoanPoolsPanel, LoanPortfolioList, DailyCollectionReportPanel, AuditLogReportPanel, DefaulterReportPanel, CollectorPerformanceReportPanel, FinancialLedgerReportPanel, LoanPortfolioReportPanel, GroupRiskReportPanel |
| `BorrowerProfileActions` | `src/features/borrower-management/components/BorrowerProfileActions.tsx` | BorrowerProfilePanel |
| `ManagementToolbar` | `src/components/layout/executive/ManagementToolbar.tsx` | All list/report panels above |
| `ExportDownloadIcon` | `src/components/icons/ExportDownloadIcon.tsx` | WilmsExportActions, ExportCsvButton, BorrowerProfileActions |

---

## Sign-off

Export containers now follow WILMS executive toolbar standards. Dashboard layouts were **not** modified.
