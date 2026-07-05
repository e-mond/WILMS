# P11 Deliverable Report ÔÇö Navigation, User Management, Collections, Expenses, Layout Validation

Generated: 2026-06-09

## What was implemented

### 1. Navigation performance audit Ô£à

See [`navigation-performance-audit.md`](./navigation-performance-audit.md).

- Aside context split + stable hooks
- Centralized nav active state with Suspense
- Super-admin `loading.tsx`
- Dynamic imports: Settings, Loan Pools, Risk & Flags, Reports
- Lazy Excel/PDF in `WilmsExportActions`
- Drawer close guard in `DashboardShell`

### 2. User profile & permissions Ô£à (foundation)

| Feature | Status |
|---|---|
| User profile modal (full name, staff ID, role, status, phone, email, region, zone, groups, borrowers, activity, login, audit, performance) | Ô£à `SettingsUserProfileModal` |
| View profile from users table | Ô£à |
| Role list with clone/delete | Ô£à `SettingsRolesSection` |
| Permission catalog (18 permissions, 5 system roles) | Ô£à `mocks/roles-permissions.ts` |
| Service API (`listRoles`, `cloneRole`, `getUserProfile`, etc.) | Ô£à `ISettingsService` extended |
| Create/edit role UI with permission toggles | ­ƒöä Clone/delete only; full editor pending |
| Dedicated `/users/[id]` route | ­ƒö▓ Modal-based for now |

### 3. Collection calculations Ô£à (service layer)

| Feature | Status |
|---|---|
| Daily / weekly / monthly / quarterly / yearly periods | Ô£à `COLLECTION_PERIOD` |
| Scopes: collector, group, region, pool, organisation | Ô£à `buildCollectionMetrics()` |
| Transaction-derived repayments | Ô£à `transaction-log.store` |
| `ICollectionMetricsService` + mock + production stub | Ô£à |
| `useCollectionMetrics` hook | Ô£à |
| Dashboard KPI wiring | ­ƒöä Service ready; dashboard panel integration pending |
| Collector profile metrics in user profile | Ô£à From collection builder |
| Dedicated analytics/report pages | ­ƒö▓ Hook + service only |

### 4. Expense management Ô£à (foundation)

| Feature | Status |
|---|---|
| Categories (fuel, transport, airtime, field ops, office, meetings, other) | Ô£à |
| Expense records with ID, amount, date, reason, notes, receipt, GPS, recorded by | Ô£à |
| Approval workflow (approve/reject) | Ô£à Settings expenses section |
| `IExpenseService` + mock store | Ô£à |
| Collector expense submission form | ­ƒö▓ Admin review UI only |
| Export / print expense reports | ­ƒö▓ Not started |
| Receipt upload multipart | ­ƒö▓ Placeholder field only |

### 5. Loan Pools desktop/mobile validation Ô£à

| Reference item | Status |
|---|---|
| 3-column shell (sidebar + main + aside) | Ô£à Already PG-04 complete |
| KPI row with icons | Ô£à |
| Search + filter pills + export | Ô£à |
| Executive table (desktop) | Ô£à `lg+` |
| Mobile card layout (not shrunk table) | Ô£à `LoanPoolsMobileCardList` |
| Aside: pool detail, allocation, activity | Ô£à |
| Stable aside content (no date churn) | Ô£à Fixed |

### 6. Collector dashboard desktop/mobile Ô£à

| Reference item | Status |
|---|---|
| KPI performance summary | Ô£à |
| Quick actions row | Ô£à Added |
| Mobile alerts inline | Ô£à |
| Mobile borrower cards | Ô£à `CollectorBorrowerMobileCards` |
| Desktop table + sidebar schedule | Ô£à `ExecutiveDetailLayout` |
| Performance charts / collection trends | ­ƒö▓ Not in scope of REQ-075 mock |
| Assigned groups section | ­ƒö▓ Pending collector dashboard service expansion |
| Field mobile nav drawer fix | ­ƒö▓ Documented gap; bottom nav remains primary |

---

## What remains

| Area | Items |
|---|---|
| User management | Role create/edit modal with permission matrix; dedicated user profile route |
| Collections | Wire `useCollectionMetrics` into dashboard, collector profiles, reports hub |
| Expenses | Collector submission form, receipt upload, export/print, audit on approve |
| Collector dashboard | Charts, groups overview, activity timeline, mobile connection chip |
| Navigation | Risk Flags query deferral; mock delay tuning |
| Backend | OpenAPI for new endpoints (see below) |

---

## Backend integration readiness

**Updated estimate: ~74%** (up from ~72%)

| Layer | Change |
|---|---|
| New services | `ICollectionMetricsService`, `IExpenseService` |
| Extended `ISettingsService` | Profiles, roles, permissions |
| Production stubs | `/analytics/collections`, `/expenses`, `/settings/roles`, `/settings/users/{id}/profile` |
| Mock compliance | Collection metrics from transactions; expenses from `MOCK_EXPENSES` |

### Missing API contracts

- `GET /analytics/collections?period=&scope=`
- `GET|POST|PATCH /expenses`
- `GET /settings/users/{id}/profile`
- `GET|POST|PATCH|DELETE /settings/roles`
- `GET /settings/permissions`
- Multipart receipt upload

### Architectural gaps

- Utils still should not import mock stores long-term (collection builder correctly in `services/mock/`)
- Role permission enforcement not wired to `RoleGuard` (catalog only)
- Collector expense path not connected to field shell

---

## Updated roadmap

| Phase | Focus | Target |
|---|---|---|
| P11a | Wire collection metrics to dashboard + reports | Next |
| P11b | Role editor UI + permission enforcement hooks | Next |
| P11c | Collector expense capture + receipt upload | Next |
| P11d | Collector dashboard charts + groups section | Following |
| P12 | Backend OpenAPI v1 + contract tests | Before cutover |
| P13 | Full completion gate (lint, test, build, E2E) | Production gate |

---

## Files added / changed (key)

```
src/components/layout/shell/AsideSlotContext.tsx
src/hooks/useShellAsideContent.ts
src/layouts/ShellNavigation.tsx
src/layouts/ShellNavLink.tsx
src/app/(super-admin)/loading.tsx
src/features/export/components/WilmsExportActions.tsx
src/types/collection-metrics.ts
src/types/expense.ts
src/types/user-management.ts
src/services/mock/collection-metrics.builder.ts
src/services/mock/expenseService.mock.ts
src/services/mock/settings-roles.store.ts
src/features/settings/components/SettingsUserProfileModal.tsx
src/features/settings/components/SettingsRolesSection.tsx
src/features/settings/components/SettingsExpensesSection.tsx
src/features/loan-pools/components/LoanPoolsMobileCardList.tsx
src/features/payment-collection/components/CollectorBorrowerMobileCards.tsx
context/page-validation/navigation-performance-audit.md
```
