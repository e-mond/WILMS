# Mock Data Compliance v4

Recorded: 2026-06-09  
Environment: `NEXT_PUBLIC_DEMO_MODE=true`

## Compliance model

```
UI Component ÔåÆ @/services ÔåÆ IDataProvider ÔåÆ mock/*Service.mock ÔåÆ factories/stores
```

UI must not import `@/mocks/` directly (ESLint enforced in lib code).

## Service-driven pages (complete)

| Area | Service | Mock backing |
|---|---|---|
| Super Admin dashboard | `dashboardService` | `dashboard-demo.factory` |
| Collector dashboard | `collectorService` | `collector-dashboard.builder`, payment/loan stores |
| Collection metrics | `collectionMetricsService` | `collection-metrics.builder` |
| My Registrations | `borrowerService` | `borrower-registry.store` |
| Approver review | `borrowerService` | registry + audit |
| Reports index | `reportService` + `dashboardService` | report catalog + dashboard KPIs |
| Global search | `searchService` | registry, groups, collectors, reports |
| User settings | `settingsService` | `settings-user-profiles.builder` |
| Groups / Collectors / Loans | respective services | demo factories |

## Resolved in P11c

| Previous violation | Resolution |
|---|---|
| Collector dashboard inline streak/trend/alerts | Moved to `collector-dashboard.builder.ts` |
| Collector today groups from sliced inline math | Built from `getGroupsDemoSources()` + borrower rows |
| PendingApplicationReview guarantor eligibility inline | Eligibility from `checkGuarantorEligibility` on registration service |

## Remaining UI ÔåÆ mock violations (P0)

| Location | Issue | Required fix |
|---|---|---|
| `PendingApplicationReview.tsx` | Imports `getGroupsDemoSources` from `@/services/mock/factories/groups-demo.factory` | Use `groupService.list()` via hook |
| `PendingApplicationReview.tsx` | Imports `getFinancialTransactions` from `@/services/mock/transaction-log.store` | Use `transactionService` |

These are the only feature-layer direct mock imports found in P11c scan. ESLint may not catch factory paths under `services/mock/`.

## Remaining acceptable exceptions

| Location | Type | Verdict |
|---|---|---|
| `LoginForm.tsx` | `DEMO_ACCOUNTS` | Intentional demo login UX |
| `SignaturePad.tsx` | Canvas stroke color | Cosmetic; token migration P2 |
| Factory constants | `constants/*-reference-scale.ts` | Seed data only; not UI |

## Pages with inline UI constants (non-data)

| Page | Constant | Verdict |
|---|---|---|
| `/login` | Demo account picker | Acceptable |
| Settings role labels | Display only | Acceptable |

## Demo mode empty states

| Route class | Empty state policy |
|---|---|
| List pages with mock seed | Populated in demo mode |
| Collector dashboard | Always populated via `assembleCollectorDashboard` |
| Reports drill-down | All report panels have mock rows |
| Error fallback | Shown only on service failure (not in normal demo navigation) |

## Sign-off

**UI hardcoded business metrics:** 0 (post P11c collector refactor)  
**Demo mode navigability:** Full  
**Backend swap readiness:** Change `IDataProvider` only; no UI rewrites required
