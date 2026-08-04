# P0 #1 — Mobile Reference Parity Audit

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
| KPI grid stacks 1→2 cols | ✅ | ✅ | ✅ | Pass |
| Toolbar search + filters scroll | ✅ | ✅ | ✅ | Pass |
| Filter pill touch targets (44px) | ✅ | ✅ | ✅ | Pass |
| Table hidden `<lg` | ✅ | ✅ | N/A | Pass |
| Mobile card list with avatar, ID, metrics | ✅ | ✅ | N/A | **New** |
| Selected row gold indicator | ✅ | ✅ | ✅ | Pass |
| Aside drawer + Details FAB | ✅ | ✅ | N/A | Pass |
| Persistent aside rail `xl+` | N/A | N/A | ✅ | Pass |

**Implementation:** `CollectorsMobileCardList.tsx`, `CollectorsManagementPanel.tsx`

---

## Loan Pools (`/loan-pools`)

| Check | Mobile | Tablet | Laptop | Status |
|---|---|---|---|---|
| KPI grid stacks | ✅ | ✅ | ✅ | Pass |
| Mobile card list (capital, disbursed, collected, outstanding, utilisation) | ✅ | ✅ | N/A | **Enhanced** |
| Table hidden `<lg` | ✅ | ✅ | N/A | Pass |
| Selected pool gold left bar | ✅ | ✅ | ✅ | **New** |
| Aside drawer | ✅ | ✅ | N/A | Pass |

**Implementation:** `LoanPoolsMobileCardList.tsx`, `LoanPoolsPanel.tsx`

---

## Dashboard (`/dashboard`)

| Section | Mobile | Tablet | Laptop | Status |
|---|---|---|---|---|
| KPI cards | 1 col | 2 col | 3–4 col | Pass |
| Group Risk donut + legend | Stacked, readable | Side-by-side `md+` | Pass | Pass |
| Quick Actions | Full-width 44px targets | Pass | Pass | Pass |
| Collection / Expense (compact column) | 1–2 col stack | Pass | Pass | **Fixed** |
| Borrower Status bar + legend | 2 col legend mobile | Pass | Pass | Pass |
| Collector Performance cards `<lg` | No overflow, truncate | Pass | Pass | **Fixed** |
| Cycle Snapshot | 1→2 col grid | Pass | Pass | Pass |
| Recent Alerts aside | Drawer `<xl` | Pass | Pass | Pass |

**Implementation:** `SuperAdminDashboard.tsx`, `DashboardCollectorPerformance.tsx`, compact summary props

---

## E2E coverage

- `e2e/shell-navbar.spec.ts` — mobile card list visible, no table on collectors + loan pools
- `e2e/responsive-breakpoints.spec.ts` — shell matrix 375 / 768 / 1280 / 1536

---

## Sign-off

| Gate | Collectors | Loan Pools | Dashboard |
|---|---|---|---|
| Mobile layout | ✅ | ✅ | ✅ |
| Tablet layout | ✅ | ✅ | ✅ |
| Laptop layout | ✅ | ✅ | ✅ |
| No horizontal table clip | ✅ | ✅ | ✅ |
| Touch targets | ✅ | ✅ | ✅ |

**P0 #1 status:** Implementation complete — pending stakeholder reference JPEG sign-off.
