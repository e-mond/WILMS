# WILMS — Design Reference Analysis
> Approved JPEGs in `context/design-references/` | Last updated: 2026-06-08

---

## Shared Shell (all six references)

| Element | Reference requirement | Implementation target |
|---|---|---|
| Layout | Navbar (full width) + sidebar + main + right aside + footer | `DashboardShell` |
| Sidebar | Dark executive; gold active state; icons + labels; version footer | `AppSidebar` |
| Sidebar collapse | Icon-only mode with tooltips (inferred from directive) | `shellLayoutStore` + collapsed `ShellNavLink` |
| Navbar | Breadcrumbs, LIVE badge, datetime, notification bell, user avatar | `AppNavbar` |
| AppAside | Persistent right rail on management pages | `AppAside` (xl+); drawer below xl |
| Footer | Tagline + sync status + green dot | `OfficeShellFooter` |

---

## WILMSSuperAdminDashboard.jpeg → `/dashboard`

| Widget | Required |
|---|---|
| 4 financial KPIs with trend % | Total Pool Funds, Disbursed, Collected, Outstanding |
| Borrower Status segmented bar | Total count + Active / At Risk / Defaulted / Blacklisted / **Pending** |
| Quick Actions | Approve Adjustment, Review Variance, View Audit Log |
| Collector Performance table | Expected, Actual, Rate%, Variance (color-coded) |
| Group Risk donut | Center label + legend percentages |
| Cycle Snapshot | 6-metric grid |
| Recent Alerts | Right aside feed with critical count |

---

## GroupsManagement.jpeg → `/groups`

| Widget | Required |
|---|---|
| 4 KPIs | Active Groups, Total Members, Flagged/Suspended, Avg Collection Rate |
| Toolbar | Search, 5 filter pills, Export, + New Group |
| Table | Gold Group ID, financial columns, risk badges, pagination |
| AppAside | Selected group summary, member avatar stack, financial grid, actions |
| Widgets | Risk distribution bars, recent activity feed |

---

## CollectorsManagement.jpeg → `/collectors`

| Widget | Required |
|---|---|
| 4 KPIs | Total, Avg Rate, Below 70%, Active Today |
| Toolbar | Search, 6 filters, Export, + Add Collector |
| Table | Photo, zone, groups, borrowers, financials, rate, trend sparkline, streak |
| Pagination | Showing X of Y + page numbers |
| AppAside | Profile card, rate progress bar, streak badge, 6-month bar chart, alerts |

---

## LoanPools.jpeg → `/loan-pools`

| Widget | Required |
|---|---|
| 4 KPIs | Pool Funds, Active Pools, Disbursed, Outstanding |
| Toolbar | Search, filter pills, Export, + New Pool |
| Table | Utilisation bars, financial columns, pagination |
| AppAside | Pool detail, fund allocation bars, recent activity |

---

## RiskFlags.jpeg → `/risk-flags`

| Widget | Required |
|---|---|
| 4 KPIs | Open Flags, Blacklisted, Arrears, High-Risk Borrowers |
| Toolbar | Search, filters, Export, Raise Flag (primary red) |
| Table | Flag ID, entity, types, community, officer, raised, arrears |
| AppAside | Flag detail, timeline stepper, escalate/resolve/assign actions |
| Widgets | Flag type breakdown, recent blacklistings with photos |

---

## Settings.jpeg → `/settings`

| Widget | Required |
|---|---|
| Configuration sub-nav | 10 categories with gold active marker |
| Security & Access | 2FA, session timeout, password policy, IP allowlist, lockout |
| User Management | Table with avatars, roles, last login, status, Invite User |
| Loan Rules | Editable max amount, group size, duration, rollovers, grace |
| SMS & Comms | Provider, toggles, sender ID |
