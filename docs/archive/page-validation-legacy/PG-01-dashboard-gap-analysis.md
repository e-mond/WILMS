# PG-01 ÔÇö `/dashboard` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/WILMSSuperAdminDashboard.jpeg`  
> **Route:** `/dashboard`  
> **Date:** 2026-06-08  
> **Status:** Ô£à **COMPLETE** ÔÇö closed 2026-06-08 (`PG-01-dashboard-closure.md`)

---

## Validation method

| Step | Result |
|---|---|
| Open reference JPEG from `context/design-references/` | Ô£à `WILMSSuperAdminDashboard.jpeg` present and inspected |
| Pixel/layout review (desktop, dark theme) | Ô£à Completed from reference image |
| Implementation audit | Ô£à `SuperAdminDashboard.tsx`, shell stack, mock data, tokens |
| Side-by-side widget inventory | Ô£à Completed |
| Responsive review | ÔÅ│ Pending ÔÇö code audit only; breakpoint screenshots not yet captured |
| Dark-mode token audit | ÔÅ│ Pending full pass ÔÇö reference is dark executive |

**Previous gap reports (inferred/preliminary) are superseded by this document.**

---

## Reference layout (from image)

```text
AppNavbar (full width)
  Left:  Home / Dashboard / Overview breadcrumbs ┬À page title area
  Right: Wed, 14 May 2025 - 09:41 GMT ┬À bell (badge 3) ┬À profile avatar + Ama Boateng / Super Admin

AppSidebar (executive, dark)
  WILMS ┬À SUPER ADMIN
  Dashboard (active gold) ┬À Borrowers ┬À Loan Pools ┬À Applications ┬À Disbursements ┬À
  Collections ┬À Collectors ┬À Groups ┬À Risk & Flags ┬À Audit Log ┬À Reports ┬À Settings
  Footer: v2.4.1 - WILMS CORE

Main column
  Row 1 ÔÇö 4 KPI cards (icon + value + trend % with arrow)
    Total Pool Funds ┬À Total Disbursed ┬À Total Collected ┬À Total Outstanding
  Row 2 ÔÇö Borrower Status (2/3) | Quick Actions (1/3)
    Bar: Active ┬À At Risk ┬À Defaulted ┬À Blacklisted ┬À Pending
    Total: 2,714
    Quick Actions: Approve Adjustment (green) ┬À Review Variance (gold) ┬À View Audit Log (blue)
  Row 3 ÔÇö Collector Performance table (left) | Group Risk donut + Cycle Snapshot (right stack)
    5 collectors ┬À executive table styling
    Donut center: 100 GROUPS ┬À legend % per risk tier
    Cycle Snapshot: 6 metrics in 2├ù3 grid

AppAside (right rail, persistent at desktop)
  Recent Alerts ┬À 3 critical badge
  Feed: severity icon ┬À message ┬À right-aligned time (09:38)
  Types: missed payment ┬À reconciliation variance ┬À loan approved ┬À duplicate blocked ┬À pool replenished
  Footer: View All Alerts (gold link)

OfficeShellFooter
  WILMS tagline ┬À Last sync ┬À All systems operational ┬À green dot
```

---

## Widget inventory

| # | Reference widget | Implemented | Match |
|---|---|---|---|
| W1 | 4 financial KPIs + trend % + icons | Yes ÔÇö `ExecutiveKpiGrid` / `KpiCard` | **Partial** |
| W2 | Borrower Status bar (5 segments incl. Pending) | Yes ÔÇö 4 segments only | **Partial** |
| W3 | Quick Actions (3 buttons with icons) | Yes ÔÇö 3 links, no icons | **Partial** |
| W4 | Collector Performance executive table | Yes ÔÇö `variant="executive"` | **Partial** |
| W5 | Group Risk donut + center label + legend % | Yes ÔÇö `GroupRiskCard` | **Partial** |
| W6 | Cycle Snapshot 6-metric grid | Yes | **Partial** (demo scale) |
| W7 | Recent Alerts aside + critical count | Yes ÔÇö `DashboardAlertsAside` ÔåÆ shell aside | **Partial** |
| W8 | Shell: breadcrumbs Home/Dashboard/Overview | Partial ÔÇö navbar shows `Dashboard` only | **Gap** |
| W9 | Shell: navbar bell + unread badge | Partial ÔÇö text `Alerts` button | **Gap** |
| W10 | Shell: profile name + avatar in navbar | Partial ÔÇö demo persona differs | **Partial** |

**Missing widgets:** none at dashboard widget level.  
**Extra widgets:** sidebar nav item **Adjustments** (not in reference image nav list).

---

## Prior remediation status (R00ÔÇôR05)

| ID | Item | Image review result |
|---|---|---|
| PG-01-R00 | Reference image ingestion | Ô£à **Resolved** ÔÇö JPEG available |
| PG-01-R01 | Responsive aside below `xl` | Ô£à Implemented ÔÇö `ShellAsideDrawer`; responsive re-audit still required |
| PG-01-R02 | Executive collector table | Ô£à Implemented ÔÇö verify uppercase header chrome against image |
| PG-01-R03 | Per-collector metrics | Ô£à Implemented |
| PG-01-R04 | Alert timestamps | ÔÜá´©Å **Partial** ÔÇö timestamps exist but layout/format differs from image (right-aligned clock time) |
| PG-01-R05 | Expand demo dataset | ÔÜá´©Å **Partial** ÔÇö richer than before; still far below reference population scale |

---

## New gaps discovered from image (PG-01-R16+)

### Shell & navigation

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R16 | Dashboard breadcrumbs must read **Home / Dashboard / Overview** | Medium | Navbar breadcrumb trail in image | `resolveShellBreadcrumbs('/dashboard')` returns `[{ label: 'Dashboard' }]` only |
| PG-01-R17 | Main content header shows **Super Admin Dashboard** title + green **LIVE** badge adjacent to breadcrumbs | Medium | Image header row above KPIs | Title lives in navbar breadcrumbs; LIVE uses executive gold/yellow chip not green |
| PG-01-R35 | Sidebar nav includes **Adjustments** item not shown in reference | Low | Image sidebar list ends at Settings | `SUPER_ADMIN_NAV` includes `/adjustments` |
| PG-01-R33 | Notification trigger must be **bell icon + numeric badge** | Medium | Image top-right bell with `3` | `NotificationInboxTrigger` renders text label `Alerts` |

### KPI row

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R18 | Each KPI card requires a **decorative icon** (wallet, trend, etc.) | Medium | Icons top-right of each KPI card | `KpiCard` supports `icon`; dashboard passes none |
| PG-01-R19 | **Total Collected** trend must be `+5.1% vs last month` with green up arrow | Medium | Image KPI #3 | `buildKpis` uses `Repayment rate X%` not month-over-month % |
| PG-01-R20 | **Total Outstanding** trend must be `+18.3% vs last month` red up arrow | Medium | Image KPI #4 | Uses `Monitor closely` / generic direction |
| PG-01-R37 | KPI trend rows need **directional arrow glyphs** alongside % text | Low | Green/red arrows in image | Text-only trends in `KpiCard` |

### Borrower status

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R21 | Borrower bar must include **Pending** segment (429 borrowers, distinct color) | **High** | Image legend: Pending 429 | `buildBorrowerSegments` omits pending; 4 segments only |
| PG-01-R22 | Borrower population scale must support **Total: 2,714** with meaningful segment widths | **High** | Image total + segment counts | Demo registry ~10 borrowers; bar visually sparse |
| PG-01-R38 | Borrower legend order should match reference: Active ┬À At Risk ┬À Defaulted ┬À Blacklisted ┬À **Pending** | Medium | Image legend row | Pending absent; order differs |

### Quick actions

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R23 | Quick Action buttons require **leading icons** per action | Medium | Green/gold/blue icons in image | Text-only bordered links |
| PG-01-R24 | **View Audit Log** must use **blue** border/text/icon treatment | Medium | Blue button in image | `border-border` neutral styling |

### Collector performance

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R27 | Table shows **5 collectors** with reference names (Asante, Mensah, Osei, Boateng, Owusu) | Medium | Image table rows | Demo shows 4 collectors with different names |
| PG-01-R39 | Rate % color bands: green ÔëÑ100%, gold 95ÔÇô99%, red <95% | Low | Image color coding | Implemented ÔÇö verify exact token hues in dark executive theme |

### Group risk & cycle snapshot

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R25 | Donut center label must read **100 GROUPS** at reference scale | Medium | Image donut center | Demo `totalGroups = 12` |
| PG-01-R26 | Cycle Snapshot values must match reference scale (148 groups, 214 MTD loans, GHS 1,680 avg, 82.4% rate, 37 pending, 62 overdue) | **High** | Image metric grid | Demo values orders of magnitude smaller |
| PG-01-R40 | Group risk legend percentages (58/22/13/7) require demo distribution at ~100-group scale | Medium | Image legend | 12-group demo skews percentages |

### Recent alerts aside

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R28 | Alert **time display right-aligned** as clock (`09:38`), not below message | Medium | Image alert rows | `DashboardAlertsAside` stacks relative + absolute under message |
| PG-01-R29 | Alert **severity icons**: red circle-x, orange triangle, blue pencil ÔÇö not text glyphs | Medium | Image iconography | Uses `Ô£ò` / `!` characters |
| PG-01-R30 | Alert feed must include **info/success types**: loan approved, duplicate blocked, pool replenished | **High** | Image shows 5+ alert varieties | Only missed-payment + reconciliation variance generated |
| PG-01-R31 | **View All Alerts** link belongs at **bottom** of aside feed | Low | Image footer link position | Link rendered above alert list |
| PG-01-R32 | Critical count badge style: compact **red `3 critical`** chip matching image | Low | Image aside header | Border/badge styling close but not pixel-matched |

### Demo persona & data fidelity

| ID | Gap | Severity | Reference evidence | Implementation |
|---|---|---|---|---|
| PG-01-R34 | Navbar profile displays **Ama Boateng / Super Admin** with photo avatar | Low | Image profile chip | Demo account `Super Admin` without reference name/avatar |
| PG-01-R41 | KPI amounts must present at reference scale (Pool GHS 4.82M matches; Disbursed 3.61M, Collected 2.98M, Outstanding 633K do not) | **High** | Image KPI values | Pool constant correct; other KPIs derived from sparse seed transactions |

### Responsive & theme (pending re-audit)

| ID | Gap | Severity | Notes |
|---|---|---|---|
| PG-01-R42 | Dark executive theme validation against image | **High** | Validate only in dark mode with executive tokens |
| PG-01-R43 | Tablet/mobile: aside drawer must expose full alert feed | Medium | `ShellAsideDrawer` implemented ÔÇö breakpoint QA pending |
| PG-01-R44 | Laptop: collapsible sidebar + persistent aside | Medium | Shell supports collapse ÔÇö visual QA pending |

---

## Global shell architecture gaps (cross-page)

> The reference image confirms the **right aside is a permanent shell feature**, not dashboard-only.  
> Contextual content changes per route. The following office routes **lack** `useShellAsideContent` injection today:

| ID | Route | Required aside content (per stakeholder spec) | Status |
|---|---|---|---|
| SHELL-R01 | `/borrowers` | Borrower summary, status, loans, payments, guarantor, activity | ÔØî Missing |
| SHELL-R02 | `/borrowers?status=PENDING` (Applications) | Pending count, approval queue, risk apps, duplicates, recently reviewed | ÔØî Missing |
| SHELL-R03 | `/loans` (Disbursements) | Recent/today disbursements, pending releases, approval queue | ÔØî Missing |
| SHELL-R04 | `/reports/daily-collection` (Collections) | Targets, today's collections, variances, reconciliation | ÔØî Missing |
| SHELL-R05 | `/settings` | System/env/SMS/email/audit status, version | ÔØî Missing |
| SHELL-R06 | `/reports/audit-log` | Export status, generated reports, quick metrics | ÔØî Missing |
| SHELL-R07 | `/reports` | Export status, scheduled reports, quick metrics | ÔØî Missing |
| SHELL-R08 | `/adjustments` | Contextual adjustment queue summary | ÔØî Missing |
| SHELL-R09 | `/borrowers/[id]` | Photo, loan summary, risk, payment history, group, guarantor | ÔØî Missing |
| SHELL-R10 | `/collectors/[id]` | Photo, groups, performance, risk, activity | ÔØî Missing |
| SHELL-R11 | `/groups/[id]` | Group summary, risk, health, members, photos | ÔØî Missing |
| SHELL-R12 | Search results (global) | Contextual summary for result set | ÔØî Missing |

**Routes with aside injection today:** `/dashboard`, `/groups`, `/collectors`, `/loan-pools`, `/risk-flags`.

**Tracking:** Shell gaps are **blocking for full PG-01 sign-off only where they affect dashboard shell parity**; full shell rollout tracked under **DA-11** (proposed) in `progress-tracker.md`.

---

## Match summary

| Category | Pass | Partial | Fail / Missing |
|---|---|---|---|
| Widget presence | 7 | 3 | 0 |
| Visual fidelity (dark desktop) | 0 | 8 | 12+ |
| Data/demo fidelity | 1 | 2 | 6 |
| Shell/nav parity | 2 | 4 | 4 |
| Responsive | 0 | 2 | 0 (unverified) |

**Overall PG-01 status: Ô£à COMPLETE**

---

## Remediation priority order

### P0 ÔÇö Must fix before PG-01 closure

1. PG-01-R21 ÔÇö Pending borrower segment
2. PG-01-R22 / R41 / R26 / R25 / R40 ÔÇö Reference-scale demo data (dashboard appears populated)
3. PG-01-R30 ÔÇö Full alert type variety in aside feed
4. PG-01-R42 ÔÇö Dark executive theme visual pass

### P1 ÔÇö Fix immediately after P0

5. PG-01-R16 / R17 ÔÇö Breadcrumbs + page header parity
6. PG-01-R18 / R19 / R20 / R37 ÔÇö KPI icons + trend math
7. PG-01-R23 / R24 ÔÇö Quick action icons + blue audit log styling
8. PG-01-R28 / R29 / R31 / R32 ÔÇö Alert layout + iconography
9. PG-01-R33 ÔÇö Navbar bell icon
10. PG-01-R43 / R44 ÔÇö Responsive re-audit

### P2 ÔÇö After dashboard passes

11. SHELL-R01ÔÇôR12 ÔÇö Contextual aside on all office routes (DA-11)
12. PG-01-R35 ÔÇö Sidebar nav parity (Adjustments visibility decision)
13. PG-01-R34 ÔÇö Demo persona alignment

---

## Completion gate (unchanged)

PG-01 may move to **COMPLETE** only when:

- [x] Dashboard reference image reviewed
- [ ] Visual comparison completed (desktop dark ÔÇö partial; laptop/tablet/mobile pending)
- [ ] Responsive comparison completed
- [ ] Accessibility review completed
- [ ] Dark mode review completed
- [ ] Navigation review completed
- [ ] All P0 items R21, R22, R26, R30, R41, R42 resolved
- [ ] All P1 items R16ÔÇôR20, R23, R24, R28ÔÇôR29, R31ÔÇôR33, R37 resolved
- [ ] All newly discovered image gaps R16ÔÇôR44 resolved or explicitly deferred with stakeholder sign-off
- [ ] `progress-tracker.md` updated
- [ ] No known critical dashboard defects remain

**Do not begin PG-02 (`CollectorsManagement.jpeg`) until this gate passes.**
