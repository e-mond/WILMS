# P0 #1 ÔÇö Mobile Reference Parity Audit

> Date: 2026-06-09  
> Scope: Collectors, Loan Pools, Super Admin Dashboard responsiveness

## Reference sources

| Page | Desktop reference | Mobile pattern |
|---|---|---|
| Collectors | `CollectorsManagement.jpeg` | Card-first list `<lg`, table `lg+`, aside drawer `<xl` |
| Loan Pools | `LoanPools.jpeg` | Card-first list `<lg`, table `lg+`, aside drawer `<xl` |
| Dashboard | `WILMSSuperAdminDashboard.jpeg` | Single-column stack, card metrics, aside drawer for alerts |

---

## Collectors (`/collectors`)

| Check | Mobile | Tablet | Laptop | Status |
|---|---|---|---|---|
| KPI grid stacks 1ÔåÆ2 cols | Ô£à | Ô£à | Ô£à | Pass |
| Toolbar search + filters scroll | Ô£à | Ô£à | Ô£à | Pass |
| Filter pill touch targets (44px) | Ô£à | Ô£à | Ô£à | Pass |
| Table hidden `<lg` | Ô£à | Ô£à | N/A | Pass |
| Mobile card list with avatar, ID, metrics | Ô£à | Ô£à | N/A | **New** |
| Selected row gold indicator | Ô£à | Ô£à | Ô£à | Pass |
| Aside drawer + Details FAB | Ô£à | Ô£à | N/A | Pass |
| Persistent aside rail `xl+` | N/A | N/A | Ô£à | Pass |

**Implementation:** `CollectorsMobileCardList.tsx`, `CollectorsManagementPanel.tsx`

---

## Loan Pools (`/loan-pools`)

| Check | Mobile | Tablet | Laptop | Status |
|---|---|---|---|---|
| KPI grid stacks | Ô£à | Ô£à | Ô£à | Pass |
| Mobile card list (capital, disbursed, collected, outstanding, utilisation) | Ô£à | Ô£à | N/A | **Enhanced** |
| Table hidden `<lg` | Ô£à | Ô£à | N/A | Pass |
| Selected pool gold left bar | Ô£à | Ô£à | Ô£à | **New** |
| Aside drawer | Ô£à | Ô£à | N/A | Pass |

**Implementation:** `LoanPoolsMobileCardList.tsx`, `LoanPoolsPanel.tsx`

---

## Dashboard (`/dashboard`)

| Section | Mobile | Tablet | Laptop | Status |
|---|---|---|---|---|
| KPI cards | 1 col | 2 col | 3ÔÇô4 col | Pass |
| Group Risk donut + legend | Stacked, readable | Side-by-side `md+` | Pass | Pass |
| Quick Actions | Full-width 44px targets | Pass | Pass | Pass |
| Collection / Expense (compact column) | 1ÔÇô2 col stack | Pass | Pass | **Fixed** |
| Borrower Status bar + legend | 2 col legend mobile | Pass | Pass | Pass |
| Collector Performance cards `<lg` | No overflow, truncate | Pass | Pass | **Fixed** |
| Cycle Snapshot | 1ÔåÆ2 col grid | Pass | Pass | Pass |
| Recent Alerts aside | Drawer `<xl` | Pass | Pass | Pass |

**Implementation:** `SuperAdminDashboard.tsx`, `DashboardCollectorPerformance.tsx`, compact summary props

---

## E2E coverage

- `e2e/shell-navbar.spec.ts` ÔÇö mobile card list visible, no table on collectors + loan pools
- `e2e/responsive-breakpoints.spec.ts` ÔÇö shell matrix 375 / 768 / 1280 / 1536

---

## Sign-off

| Gate | Collectors | Loan Pools | Dashboard |
|---|---|---|---|
| Mobile layout | Ô£à | Ô£à | Ô£à |
| Tablet layout | Ô£à | Ô£à | Ô£à |
| Laptop layout | Ô£à | Ô£à | Ô£à |
| No horizontal table clip | Ô£à | Ô£à | Ô£à |
| Touch targets | Ô£à | Ô£à | Ô£à |

**P0 #1 status:** Implementation complete ÔÇö pending stakeholder reference JPEG sign-off.
