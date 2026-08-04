# PG-05 — `/risk-flags` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/RiskFlags.jpeg`  
> **Route:** `/risk-flags`  
> **Date:** 2026-06-09  
> **Status:** ✅ **COMPLETE** — closure `PG-05-risk-flags-closure.md`

---

## Validation method

| Step | Result |
|---|---|
| Reference JPEG present and inspected | ✅ |
| Implementation audit (`RiskFlagsPanel.tsx`, `RiskFlagsAsidePanel.tsx`) | ✅ |
| Widget inventory vs image | ✅ |

**Prerequisite:** PG-04 complete ✅.

---

## Reference layout

```text
AppNavbar: Dashboard > Risk & Flags · LIVE · datetime · bell · profile
KPI row: Open Flags · Blacklisted · Arrears · High-Risk Borrowers
Toolbar: Search · status filter pills · Export · Raise Flag
Table: Gold Flag ID · Entity · Type · Flag Type badges · Community · Officer · Raised · Arrears · Status
Pagination: Showing X of Y
AppAside:
  - Selected flag detail + timeline
  - Active Alerts
  - Flag Type Breakdown
  - Recent Blacklistings
```

---

## Gap remediation tasks

### P0 — Data & KPIs ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-05-R01 | 4 KPI cards with risk metrics | Image KPI row | ✅ `useRiskFlags` summary + `RiskFlagsKpiIcon` |
| PG-05-R02 | Flag registry with status/type filters | Image table | ✅ `RiskFlagsPanel` filters + pagination |

### P1 — Visual fidelity ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-05-R03 | KPI decorative icons | Image | ✅ `RiskFlagsKpiIcon` |
| PG-05-R04 | Flag ID gold styling | Image | ✅ `text-executive-gold` |
| PG-05-R05 | Status/type badge colours | Image | ✅ `FLAG_STATUS_DISPLAY` / `FLAG_TYPE_DISPLAY` |
| PG-05-R06 | Export with download icon | Image | ✅ `ExportCsvButton showDownloadIcon` |
| PG-05-R07 | Dedicated aside panel | Image | ✅ `RiskFlagsAsidePanel` |
| PG-05-R08 | Active alerts + breakdown + blacklistings | Image | ✅ Aside cards |

### P2 — Polish ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-05-R09 | Row selection drives aside detail | Image | ✅ `selectedRowId` + timeline |
| PG-05-R10 | WILMS export standard | Architecture | ✅ `WILMS_REPORT_TYPE.RISK_FLAGS` |
| PG-05-R11 | Aside drawer E2E | Shell architecture | ✅ `e2e/shell-navbar.spec.ts` |

---

## Residual (non-blocking)

- Raise Flag / Resolve / Escalate workflows remain demo toasts until backend API is connected.
