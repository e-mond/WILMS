# Skeleton Loading Audit

## Approach

Replaced generic `LoadingSpinner` usage with layout-preserving Shadcn-style `Skeleton` components to reduce CLS.

## Components

| Component | Purpose |
|---|---|
| `Skeleton` | Base pulse block |
| `CardSkeleton` | KPI / card layouts |
| `TableSkeleton` | Data tables |
| `DashboardPageSkeleton` | Full dashboard pages |
| `FormPanelSkeleton` | Form/modal loading |
| `InlinePanelSkeleton` | Compact panel loading |

## Migration Coverage

| Area | Status |
|---|---|
| Route `loading.tsx` (collector, approver, registration officer, super-admin) | ✅ Skeleton |
| `PageLoadingFallback` | ✅ Dashboard skeleton |
| `QueryStatePanel` inline variant | ✅ Skeleton |
| Settings roles/users/profile | ✅ Table/inline skeletons |
| Feature panels (collections, loans, reconciliation, etc.) | ✅ Inline skeleton |
| `WilmsSplashScreen` | ✅ Skeleton (bootstrap) |
| `LoadingButton` submit states | Kept — action-level, not page loading |

## Remaining Spinner Utility

`LoadingSpinner.tsx` retained for unit tests and legacy export surface; no longer used in active page loading paths.

## Verification

`npm run lint` and `npm run build` pass after migration.
