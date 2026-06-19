# PG-04 — `/loan-pools` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/LoanPools.jpeg`  
> **Route:** `/loan-pools`  
> **Date:** 2026-06-09  
> **Status:** ✅ **COMPLETE** — closure `PG-04-loan-pools-closure.md`

---

## Validation method

| Step | Result |
|---|---|
| Reference JPEG present and inspected | ✅ |
| Implementation audit (`LoanPoolsPanel.tsx`, mock service) | ✅ |
| Widget inventory vs image | ✅ |

**Prerequisite:** PG-01 complete ✅. PG-02 complete ✅. PG-03 complete ✅.

---

## Reference layout

```text
AppNavbar: Dashboard > Loan Pools · LIVE · datetime · bell · profile
KPI row: Pool Funds · Active Pools · Disbursed · Outstanding
Toolbar: Search · filter pills · Export · + New Pool
Table: Gold Pool ID · Name · Region · Source · financial columns · Utilisation bars
Pagination: Showing X of Y · page numbers
AppAside:
  - Selected pool detail (utilisation, financial grid)
  - Fund Allocation by Pool (progress bars)
  - Recent Pool Activity feed
```

---

## Gap remediation tasks

### P0 — Data & KPIs ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-04-R01 | 4 KPI cards aligned to dashboard pool totals | Image KPI row | ✅ `buildLoanPoolListResponse` + `DEMO_OPERATING_POOL_PESEWAS` |
| PG-04-R02 | Demo pool registry (7 regional pools) | Image table | ✅ `MOCK_LOAN_POOLS` |

### P1 — Visual fidelity ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-04-R03 | KPI decorative icons | Image | ✅ `LoanPoolsKpiIcon` on all 4 KPI cards |
| PG-04-R04 | **+ New Pool** gold primary CTA | Image | ✅ `variant="primary"` |
| PG-04-R05 | Pool ID gold styling | Image | ✅ `text-executive-gold` |
| PG-04-R06 | Utilisation bars in table | Image | ✅ `UtilisationBar` column |
| PG-04-R07 | Dedicated aside panel component | Image | ✅ `LoanPoolsAsidePanel` |
| PG-04-R08 | Fund allocation + recent activity aside | Image | ✅ Allocation bars + `ActivityFeed` |

### P2 — Polish ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-04-R09 | Export button with download icon + WILMS export standard | Image + EXP-01 | ✅ `ExportCsvButton` + `WILMS_REPORT_TYPE.LOAN_POOL` |
| PG-04-R10 | Executive row selection chrome | Image | ✅ Shared `DataTable` selected row |
| PG-04-R11 | Responsive aside drawer E2E | Shell rule | ✅ `shell-navbar.spec.ts` loan-pools mobile + laptop |

---

**Overall PG-04 status: ✅ COMPLETE**
