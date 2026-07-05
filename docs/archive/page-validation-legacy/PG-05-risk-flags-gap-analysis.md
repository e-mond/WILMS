# PG-05 ÔÇö `/risk-flags` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/RiskFlags.jpeg`  
> **Route:** `/risk-flags`  
> **Date:** 2026-06-09  
> **Status:** Ô£à **COMPLETE** ÔÇö closure `PG-05-risk-flags-closure.md`

---

## Validation method

| Step | Result |
|---|---|
| Reference JPEG present and inspected | Ô£à |
| Implementation audit (`RiskFlagsPanel.tsx`, `RiskFlagsAsidePanel.tsx`) | Ô£à |
| Widget inventory vs image | Ô£à |

**Prerequisite:** PG-04 complete Ô£à.

---

## Reference layout

```text
AppNavbar: Dashboard > Risk & Flags ┬À LIVE ┬À datetime ┬À bell ┬À profile
KPI row: Open Flags ┬À Blacklisted ┬À Arrears ┬À High-Risk Borrowers
Toolbar: Search ┬À status filter pills ┬À Export ┬À Raise Flag
Table: Gold Flag ID ┬À Entity ┬À Type ┬À Flag Type badges ┬À Community ┬À Officer ┬À Raised ┬À Arrears ┬À Status
Pagination: Showing X of Y
AppAside:
  - Selected flag detail + timeline
  - Active Alerts
  - Flag Type Breakdown
  - Recent Blacklistings
```

---

## Gap remediation tasks

### P0 ÔÇö Data & KPIs Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-05-R01 | 4 KPI cards with risk metrics | Image KPI row | Ô£à `useRiskFlags` summary + `RiskFlagsKpiIcon` |
| PG-05-R02 | Flag registry with status/type filters | Image table | Ô£à `RiskFlagsPanel` filters + pagination |

### P1 ÔÇö Visual fidelity Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-05-R03 | KPI decorative icons | Image | Ô£à `RiskFlagsKpiIcon` |
| PG-05-R04 | Flag ID gold styling | Image | Ô£à `text-executive-gold` |
| PG-05-R05 | Status/type badge colours | Image | Ô£à `FLAG_STATUS_DISPLAY` / `FLAG_TYPE_DISPLAY` |
| PG-05-R06 | Export with download icon | Image | Ô£à `ExportCsvButton showDownloadIcon` |
| PG-05-R07 | Dedicated aside panel | Image | Ô£à `RiskFlagsAsidePanel` |
| PG-05-R08 | Active alerts + breakdown + blacklistings | Image | Ô£à Aside cards |

### P2 ÔÇö Polish Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-05-R09 | Row selection drives aside detail | Image | Ô£à `selectedRowId` + timeline |
| PG-05-R10 | WILMS export standard | Architecture | Ô£à `WILMS_REPORT_TYPE.RISK_FLAGS` |
| PG-05-R11 | Aside drawer E2E | Shell architecture | Ô£à `e2e/shell-navbar.spec.ts` |

---

## Residual (non-blocking)

- Raise Flag / Resolve / Escalate workflows remain demo toasts until backend API is connected.
