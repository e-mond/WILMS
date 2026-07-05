# Backend Integration Readiness Review v4

Recorded: 2026-06-09  
Scope: Can WILMS begin backend integration without major frontend restructuring?

---

## Executive summary

**Yes ÔÇö backend integration can begin immediately** for read-heavy domains and CRUD surfaces that already consume `@/services`. The frontend architecture is mock-first with a clean provider switch (`MockDataProvider` Ôåö `ApiDataProvider`). No UI rewrites are required to swap data sources.

Integration should proceed **incrementally by service**, not as a big-bang cutover. Three areas need coordinated backend + small frontend work before they are production-ready: **registration workflow**, **phone capture**, and **group/collector assignment persistence**. Permission overrides at the edge and file uploads are the main **platform blockers** outside domain CRUD.

---

## Ready (integrate now)

### Services & providers

| Layer | Status | Detail |
|---|---|---|
| `IDataProvider` contract | Ready | Single switch in `resolveDataProviderMode()` |
| Service interfaces (`src/types/services.ts`) | Ready | 22 `I*Service` contracts |
| API service stubs (`src/services/*Service.ts`) | Ready | `apiClient` wrappers for all domains |
| Mock implementations (`src/services/mock/`) | Ready | Parity with API surface |
| Provider wiring | Ready | `index.development.ts` ÔåÆ mock; `index.production.ts` ÔåÆ API or mock fallback |
| Demo fallback | Ready | `NEXT_PUBLIC_DEMO_MODE=true` keeps UI populated |

### Domain services ÔÇö ready for API wiring

| Service | Mock | API stub | UI consumers |
|---|---|---|---|
| `dashboardService` | Yes | Yes | Super Admin dashboard |
| `collectorService` | Yes (builder) | Yes | Collector dashboard, collection sheet |
| `collectionMetricsService` | Yes | Yes | Dashboard widgets, collector KPIs |
| `borrowerService` | Yes | Yes | Borrowers, registration, approver |
| `paymentService` | Yes | Yes | Collections, reconciliation |
| `loanService` | Yes | Yes | Disbursements, portfolio |
| `loanPoolService` | Yes | Yes | Loan Pools |
| `groupService` | Yes | Yes | Groups management |
| `collectorManagementService` | Yes | Yes | Collectors admin |
| `riskFlagService` | Yes | Yes | Risk & Flags |
| `reportService` | Yes | Yes | Reports index + drill-downs |
| `auditService` | Yes | Yes | Audit log |
| `searchService` | Yes | Yes | Global search |
| `settingsService` | Yes | Yes | Settings, user management |
| `expenseService` | Yes | Yes | Collector expenses |
| `reconciliationService` | Yes | Yes | Collector reconcile |
| `transactionService` | Yes | Yes | Ledger, admin fee |
| `adjustmentService` | Yes | Yes | Adjustments |
| `overpaymentReviewService` | Yes | Yes | Overpayment review |
| `notificationService` | Yes | Yes | Inbox (mock content) |

### DTOs & types

Domain types live in `src/types/` with stable shapes used by both mock builders and API stubs. Export document builders consume service DTOs, not raw mock arrays.

### Permission system

| Component | Status |
|---|---|
| Permission models + enums | Ready |
| `PermissionProvider` (client) | Ready |
| Route matrix (`permission-matrix.ts`) | Ready |
| Middleware route guards | Ready (role-based) |
| `PermissionGate` component | Ready (partial rollout) |

### Routing

43 Next.js routes built successfully. Role-specific layouts (`super-admin`, `collector`, `officer`, `approver`, `auditor`) with middleware permission checks.

### Exports

Client-side PDF, CSV, Excel, and print builders are ready. Exports read from service data; no inline mock arrays in export paths.

---

## Partially ready (needs backend + targeted frontend work)

### Registration workflow

| Piece | Ready | Gap |
|---|---|---|
| Multi-step wizard + Zod schema | Yes | |
| Conflict checks (phone, ID, blacklist) | Service interface | API endpoints needed |
| Document/photo capture UI | Yes | Upload storage not abstracted |
| Agreement print/PDF | Yes | |
| My Registrations CRUD | Mock store | `deleteRegistration` API stub only |
| Officer KPIs / filters | Yes | |

**Work required:** Wire `registerBorrower`, conflict checks, and registration list mutations to live API. Introduce `IUploadService` for captured assets.

### Phone capture workflow

| Piece | Ready | Gap |
|---|---|---|
| QR session UI | Yes | |
| `photoCaptureSessionService` mock | Yes | |
| WebSocket / polling sync | Mock only | Production session API |

**Work required:** Backend session endpoint + completion callback; optional small hook change for transport.

### Group assignment workflow (Approver)

| Piece | Ready | Gap |
|---|---|---|
| Assign group/collector UI | Yes | |
| Review actions (approve/reject/changes) | Service-driven | API persistence |
| Group picker data | **Violation:** `PendingApplicationReview` imports `getGroupsDemoSources()` directly from mock factory | Should use `groupService.list()` |

**Work required:** Backend assignment endpoints; one frontend refactor to remove direct mock imports.

### Authentication & session

| Piece | Ready | Gap |
|---|---|---|
| Login + session cookie | Yes | |
| Role in session | Yes | |
| Resolved permissions in session | No | Middleware uses static role map; overrides ignored at edge |
| Security actions (reset PIN/password) | UI only | API wiring |

### Real-time & notifications

Mock inbox works; no SSE/WebSocket. Dashboard refresh is manual/poll. Acceptable for MVP backend cutover; not blocking initial integration.

---

## Not ready (blockers or missing contracts)

| Item | Impact | Action |
|---|---|---|
| Production `NEXT_PUBLIC_API_BASE_URL` | Cannot hit live API | DevOps + backend |
| Endpoint parity verification | Unknown mismatches | OpenAPI contract review |
| `IUploadService` | Photos/documents stuck in demo | New interface + backend presigned URLs |
| Append-only audit write API | Compliance | Backend ingestion service |
| User permission override at edge | Super Admin override UI incomplete | Session snapshot at login |
| Direct mock imports in UI | `PendingApplicationReview.tsx` | Refactor to `groupService` / `transactionService` |
| E2E CI verification | Regression risk | Run Playwright in CI before prod gate |
| Server-side export for large datasets | Performance at scale | P1, not blocking MVP |

---

## Collector dashboard ÔÇö backend readiness

The collector dashboard is **fully service-driven** after P11c:

```
UI ÔåÆ collectorService.getDashboard()
       ÔåÆ assembleCollectorDashboard() [mock]
       ÔåÆ buildCollectorDashboardCore() + metrics + groups factory
```

API path: implement `ICollectorService.getDashboard()` on the backend returning the `CollectorDashboard` DTO. **No UI changes required.**

Verified fields (all from service, not hardcoded in UI):

- Amount collected, target, % achieved
- Paid / pending / overdue borrower counts
- Today's groups with leader, photo, progress, amounts, status
- Recent payments from payment inputs
- Streak from transaction log; weekly trend from collection metrics

---

## Demo mode vs backend mode

| Mode | Env | Provider | UI changes |
|---|---|---|---|
| Demo | `NEXT_PUBLIC_DEMO_MODE=true` | `MockDataProvider` | None |
| Staging (no API) | No `NEXT_PUBLIC_API_BASE_URL` | Mock fallback in production entry | None |
| Backend | `NEXT_PUBLIC_API_BASE_URL` + `NODE_ENV=production` | `ApiDataProvider` | None |

---

## Integration sequence (recommended)

1. **Auth + session** ÔÇö login, session cookie, embed permission snapshot
2. **Read-only domains** ÔÇö borrowers list, groups, collectors, reports, dashboard KPIs
3. **Write paths** ÔÇö registration submit, approver decisions, payment record, reconciliation
4. **Uploads** ÔÇö registration photos, ID scans, signatures
5. **Audit + notifications** ÔÇö append-only log, optional real-time channel

---

## Definitive done vs missing

### Done (backend-ready architecture)

- Service boundary enforced (ESLint; one known UI exception documented)
- 22/22 service pairs (mock + API stub)
- Provider switch without UI rewrite
- DTO types stable across mock and API
- Routing + RBAC foundation
- Export pipeline service-driven
- Collector dashboard fully refactored to builder pattern
- Demo mode populates all primary screens

### Still missing (before production backend cutover)

- Live API endpoints mapped and tested
- Session permission snapshot for middleware
- `PermissionGate` on all sensitive actions
- Upload abstraction + backend storage
- Remove direct mock imports from approver review screen
- Audit write API
- E2E suite green in CI

---

## Recommendation

**Begin backend integration now** using the service-by-service approach above. The frontend will not require structural rework. Parallel track: close the three partial workflows (registration uploads, phone capture, assignment persistence) and the platform items (session permissions, upload service) while wiring read APIs first.
