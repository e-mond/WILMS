# PG-02 — `/collectors` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/CollectorsManagement.jpeg`  
> **Route:** `/collectors`  
> **Date:** 2026-06-08  
> **Status:** ✅ **COMPLETE** — closure `PG-03-collectors-closure.md`

---

## Validation method

| Step | Result |
|---|---|
| Reference JPEG present and inspected | ✅ |
| Implementation audit (`CollectorsManagementPanel.tsx`, mock service) | ✅ |
| Widget inventory vs image | ✅ |

**Prerequisite:** PG-01 complete ✅. P0 collector factory implemented 2026-06-08.

---

## Reference layout

```text
AppNavbar: Dashboard > Collectors · LIVE · datetime · bell · profile
KPI row: Total Collectors (34) · Avg Rate (84.2%) · Below 70% (6) · Active Today (28)
Toolbar: Search · filters (All/Active/Away/≥90%/70-89%/<70%) · Export · + Add Collector
Table: Collector (avatar+name+ID) · Zone · Groups · Borrowers · Expected · Collected · Rate · Trend · Streak
Pagination: Showing 8 of 34 · page numbers
AppAside:
  - Collector profile (photo, ID, Active status, zone, groups, borrowers, cycle, last active, joined)
  - Collection rate progress bar + streak badge
  - Message / Full Profile buttons
  - 6-Month Performance bar chart
  - Team Rate Distribution (14 / 14 / 6)
  - Collector Alerts (severity + timestamps)
```

---

## Widget inventory

| # | Reference widget | Implemented | Match |
|---|---|---|---|
| W1 | 4 KPI cards with icons | Yes — partial icons | **Partial** |
| W2 | Search + 6 filter pills + Export + Add | Yes | **Partial** |
| W3 | Executive table (9 columns) | Yes | **Partial** |
| W4 | Pagination with page numbers | Yes | **Yes** |
| W5 | Aside: collector profile summary | Yes | **Partial** |
| W6 | Aside: 6-month performance chart | Yes | **Partial** |
| W7 | Aside: team rate distribution | Yes | **Partial** |
| W8 | Aside: collector alerts feed | Yes | **Partial** |
| W9 | Shell aside at all breakpoints | Partial — xl+ rail; drawer below xl | **Partial** |

---

## Gap remediation tasks

### P0 — Data & scale ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-02-R01 | Demo must show **34 collectors** with reference-scale financials | Image: 8 of 34, KPI 34 total | ✅ `collectors-demo.factory.ts` + `collectors-reference-scale.ts` |
| PG-02-R02 | KPI values must match reference: **34 / 84.2% / 6 / 28** | Image KPI row | ✅ Pre-tuned rates; summary computed at 84.2% |
| PG-02-R03 | Team rate distribution **14 / 14 / 6** | Image aside card | ✅ Factory rate buckets |

### P1 — Visual fidelity ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-02-R04 | KPI cards need **decorative icons** (person, trend, pin) | Image | ✅ `CollectorsKpiIcon` on all 4 KPI cards |
| PG-02-R05 | Breadcrumbs **Dashboard > Collectors** + page title | Image navbar | ✅ `resolveShellBreadcrumbs` + `AppNavbar` h1 on `/collectors` |
| PG-02-R06 | **+ Add Collector** must be gold primary CTA | Image | ✅ `variant="primary"` explicit |
| PG-02-R07 | Collector ID format **COL-011** gold styling in table | Image | ✅ `text-executive-gold` on collector ID |
| PG-02-R08 | **Streak** column shows fire icon + `5w` | Image | ✅ `CollectorStreakIcon` + `5w` |
| PG-02-R09 | Aside profile needs **Collector ID, status dot, Cycle, Last Active, Joined** fields | Image detail block | ✅ `CollectorsAsidePanel` profile fields |
| PG-02-R10 | Aside **6-Month Performance** as separate card with color-coded bars | Image | ✅ Separate `DetailSidebarCard` + `collectorRateBarClass` |
| PG-02-R11 | Collector alerts need **severity icons + relative timestamps** | Image | ✅ `CollectorAlertIcon` + `createdAt` + `formatRelativeTime` |
| PG-02-R12 | Rate color bands: green ≥90%, gold 70–89%, red <70% | Image | ✅ `collectorRateTextClass` utility |

### P2 — Polish ✅

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-02-R13 | Row selection highlights selected collector in table | Image | ✅ Executive `aria-selected` + gold left border |
| PG-02-R14 | Export button with download icon | Image | ✅ `ExportDownloadIcon` + `showDownloadIcon` |
| PG-02-R15 | Responsive aside drawer below xl | Shell rule | ✅ `shell-navbar.spec.ts` collectors mobile + laptop |

---

## Match summary

| Category | Pass | Partial | Fail |
|---|---|---|---|
| Widget presence | 8 | 1 | 0 |
| Data/demo scale | 0 | 1 | 2 |
| Visual fidelity | 1 | 10 | 0 |

**Overall PG-02 status: ✅ COMPLETE**

---

## Recommended remediation order

1. PG-02-R01 → R02 → R03 (collector demo factory at reference scale)
2. PG-02-R04 → R09 → R10 → R11 (aside structure + icons)
3. PG-02-R05 → R06 → R07 → R08 → R12 (toolbar/table fidelity)
4. PG-02-R15 responsive QA
5. Re-run PG-02 review against image

**Blocked:** PG-02 implementation should not begin until PG-01 completion gate passes (P2 + shell aside rollout per stakeholder directive). Gap analysis is complete for planning.
