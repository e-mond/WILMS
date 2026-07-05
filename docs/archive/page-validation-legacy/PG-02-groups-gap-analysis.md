# PG-02 ÔÇö `/groups` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/GroupsManagement.jpeg`  
> **Route:** `/groups`  
> **Date:** 2026-06-09  
> **Status:** Ô£à **COMPLETE** ÔÇö closure `PG-02-groups-closure.md`

---

## Validation method

| Step | Result |
|---|---|
| Reference JPEG present and inspected | Ô£à |
| Implementation audit (`GroupsManagementPanel.tsx`, mock service) | Ô£à |
| Widget inventory vs image | Ô£à |

**Prerequisite:** PG-01 complete Ô£à. PG-03 collectors complete Ô£à.

---

## Reference layout

```text
AppNavbar: Dashboard > Groups ┬À LIVE ┬À datetime ┬À bell ┬À profile
KPI row: Active Groups (148) ┬À Total Members (2,416) ┬À Flagged/Suspended (19) ┬À Avg Rate (84.2%)
Toolbar: Search ┬À filters (All/Low Risk/At Risk/Flagged/Suspended) ┬À Export ┬À + New Group
Table: Gold Group ID ┬À Name ┬À Community ┬À Officer ┬À Members ┬À Disbursed ┬À Collected ┬À Rate ┬À Risk
Pagination: Showing 8 of 148 ┬À page numbers (19 pages)
AppAside:
  - Selected group summary (ID, badge, avatar stack, financial grid incl. outstanding)
  - Flag Group / View Full Profile actions
  - Risk Distribution (101 / 31 / 11 / 5)
  - Recent Group Activity feed with relative timestamps
```

---

## Gap remediation tasks

### P0 ÔÇö Data & scale Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-02-R01 | Demo must show **148 groups** | Image pagination | Ô£à `groups-demo.factory.ts` |
| PG-02-R02 | KPI values **148 / 2,416 / 19 / 84.2%** | Image KPI row | Ô£à `groups-reference-scale.ts` |
| PG-02-R03 | Risk distribution **101 / 31 / 11 / 5** | Image aside card | Ô£à Factory risk buckets |

### P1 ÔÇö Visual fidelity Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-02-R04 | KPI decorative icons | Image | Ô£à `GroupsKpiIcon` on all 4 KPI cards |
| PG-02-R05 | Breadcrumbs + page title | Image navbar | Ô£à Existing shell breadcrumbs + h1 |
| PG-02-R06 | **+ New Group** gold primary CTA | Image | Ô£à `variant="primary"` |
| PG-02-R07 | Group ID **GRP-0041** gold styling | Image | Ô£à `text-executive-gold` |
| PG-02-R08 | Aside financial grid incl. **Outstanding** | Image | Ô£à `GroupsAsidePanel` |
| PG-02-R09 | Member avatar stack (reference grid) | Image | Ô£à Up to 9 avatars + overflow |
| PG-02-R10 | Rate colour bands | Image | Ô£à `collectorRateTextClass` |
| PG-02-R11 | Recent activity relative timestamps | Image | Ô£à `ActivityFeed` + factory seeds |
| PG-02-R12 | Featured **GRP-0041** row pinned first | Image | Ô£à Factory featured group |

### P2 ÔÇö Polish Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-02-R13 | Executive row selection chrome | Image | Ô£à Shared `DataTable` gold border |
| PG-02-R14 | Export button with download icon | Image | Ô£à `showDownloadIcon` |
| PG-02-R15 | Pagination 8 rows / 19 pages | Image | Ô£à `GROUPS_REFERENCE_PAGE_SIZE = 8` |
| PG-02-R16 | Responsive aside drawer E2E | Shell rule | Ô£à `shell-navbar.spec.ts` groups mobile + laptop |

---

**Overall PG-02 status: Ô£à COMPLETE**
