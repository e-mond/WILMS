# PG-04 ÔÇö `/loan-pools` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/LoanPools.jpeg`  
> **Route:** `/loan-pools`  
> **Date:** 2026-06-09  
> **Status:** Ô£à **COMPLETE** ÔÇö closure `PG-04-loan-pools-closure.md`

---

## Validation method

| Step | Result |
|---|---|
| Reference JPEG present and inspected | Ô£à |
| Implementation audit (`LoanPoolsPanel.tsx`, mock service) | Ô£à |
| Widget inventory vs image | Ô£à |

**Prerequisite:** PG-01 complete Ô£à. PG-02 complete Ô£à. PG-03 complete Ô£à.

---

## Reference layout

```text
AppNavbar: Dashboard > Loan Pools ┬À LIVE ┬À datetime ┬À bell ┬À profile
KPI row: Pool Funds ┬À Active Pools ┬À Disbursed ┬À Outstanding
Toolbar: Search ┬À filter pills ┬À Export ┬À + New Pool
Table: Gold Pool ID ┬À Name ┬À Region ┬À Source ┬À financial columns ┬À Utilisation bars
Pagination: Showing X of Y ┬À page numbers
AppAside:
  - Selected pool detail (utilisation, financial grid)
  - Fund Allocation by Pool (progress bars)
  - Recent Pool Activity feed
```

---

## Gap remediation tasks

### P0 ÔÇö Data & KPIs Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-04-R01 | 4 KPI cards aligned to dashboard pool totals | Image KPI row | Ô£à `buildLoanPoolListResponse` + `DEMO_OPERATING_POOL_PESEWAS` |
| PG-04-R02 | Demo pool registry (7 regional pools) | Image table | Ô£à `MOCK_LOAN_POOLS` |

### P1 ÔÇö Visual fidelity Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-04-R03 | KPI decorative icons | Image | Ô£à `LoanPoolsKpiIcon` on all 4 KPI cards |
| PG-04-R04 | **+ New Pool** gold primary CTA | Image | Ô£à `variant="primary"` |
| PG-04-R05 | Pool ID gold styling | Image | Ô£à `text-executive-gold` |
| PG-04-R06 | Utilisation bars in table | Image | Ô£à `UtilisationBar` column |
| PG-04-R07 | Dedicated aside panel component | Image | Ô£à `LoanPoolsAsidePanel` |
| PG-04-R08 | Fund allocation + recent activity aside | Image | Ô£à Allocation bars + `ActivityFeed` |

### P2 ÔÇö Polish Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-04-R09 | Export button with download icon + WILMS export standard | Image + EXP-01 | Ô£à `ExportCsvButton` + `WILMS_REPORT_TYPE.LOAN_POOL` |
| PG-04-R10 | Executive row selection chrome | Image | Ô£à Shared `DataTable` selected row |
| PG-04-R11 | Responsive aside drawer E2E | Shell rule | Ô£à `shell-navbar.spec.ts` loan-pools mobile + laptop |

---

**Overall PG-04 status: Ô£à COMPLETE**
