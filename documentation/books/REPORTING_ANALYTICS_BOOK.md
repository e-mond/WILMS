# WILMS Reporting & Analytics Book

**Version:** 1.7.3  
**Classification:** Confidential

---

## 1. Overview

WILMS provides operational reports, executive intelligence, forecasting, and contextual export capabilities for programme oversight and board presentation.

---

## 2. Report types

| Report | Description | Primary audience |
|--------|-------------|-----------------|
| Portfolio summary | Active loans, disbursed, collected, outstanding | Admin, Auditor |
| Collection performance | Weekly/monthly collection rates | Admin, Director |
| Overdue analysis | Past-due loans by age bucket | Admin, Approver |
| Disbursement register | All disbursements in period | Admin, Auditor |
| Expense summary | Expenses by category and status | Admin, Finance |
| Reconciliation status | Open and resolved reconciliations | Admin |
| Borrower register | Full borrower listing | Admin, Auditor |
| Group performance | Collection rates by group | Admin, Collector lead |

---

## 3. Executive intelligence

Available at `/executive` for admin and authorized roles.

### KPI categories

**Financial:** Total disbursed, collected, outstanding, pool utilisation, expense totals.

**Operational:** Active borrowers, collection rate, groups served, collector count.

**Risk:** Flagged borrowers, overdue count, reconciliation aging, forecast variance.

### Forecasting

Schedule-based projection with configurable horizon (default 28 days). Projects expected collections based on active loan schedules.

### Portfolio breakdown

Dimensions: district, community, group. Drill-down from summary to detail.

### Compliance pack

One-click export of KPI summary, portfolio snapshot, and audit sample for external review.

---

## 4. Export capabilities

### v1.7.3: Contextual exports (primary pattern)

Export initiated from the page displaying source data:

| Source | Formats |
|--------|---------|
| Report results | PDF, Excel, CSV, Print |
| Borrower profile | PDF, Print |
| Executive intelligence | PDF compliance pack |
| Reconciliation summary | PDF, Excel |

### Export engines

Located in `apps/frontend/src/features/export/`:
- **PDF** — jsPDF with branded cover page (#0F6E56)
- **Excel** — ExcelJS workbooks
- **CSV** — Standard comma-separated
- **Print** — iframe-based, no popup blockers
- **DOCX** — Word documents via docx library

All exports include confidentiality footer.

### Export job API (retained)

`POST/GET /exports/jobs` for programmatic export tracking. Used by embedded flows. Standalone Export Center UI removed v1.7.3.

---

## 5. Dashboard analytics

### Operational dashboard

Reconciliation aging, pending table, Recent Activity feed, collection metrics. Task-oriented for daily operations.

### SQL aggregation

Dashboard KPIs prefer SQL aggregates over client-side computation. Fail-closed on oversized unpaginated report requests (422).

---

## 6. Analytics events

Analytics module tracks user interaction events for product improvement. No external APM vendor in production.

---

## 7. Best practices

- Run portfolio summary before board meetings
- Export compliance pack monthly for records
- Use forecast for cash flow planning
- Filter reports by district/community for regional reviews

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
