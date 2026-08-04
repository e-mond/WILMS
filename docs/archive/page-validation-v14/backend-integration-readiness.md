# Backend Integration Readiness Assessment (Pre-P10)

Assessment date: 2026-06-09

## Executive answers

| Question | Answer |
|---|---|
| **1. Ready for backend integration?** | **Partially** — core service interfaces and production stubs exist; mock cutover path is defined but not fully exercised. |
| **2. Percentage ready** | **~72%** (weighted: services 85%, API client 60%, auth 75%, forms 80%, reports 70%, edge cases 40%, NFR 50%) |
| **3. Architectural gaps** | Utils importing mock stores; dual auth paths; missing `delete`/multipart on `apiClient`; no OpenAPI contract; settings mostly read-only |
| **4. Missing API contracts** | See § Missing contracts below |
| **5. Frontend refactor before integration** | Report filter dropdowns; utils→service migration; settings CRUD for org/loan rules; signature/GPS upload endpoints |
| **6. Integration risks** | Auth cookie vs Bearer mismatch; pagination/filter query param inconsistency; offline queue replay idempotency; encryption assumption (REQ-087) |

---

## Layer audit

### Services (`src/services/`)

| Service | Interface | Mock | Production stub | Ready |
|---|---|---|---|---|
| `authService` | ✅ | ✅ | BFF `/api/auth/*` | 🔄 Dual path |
| `borrowerService` | ✅ | ✅ | `apiClient` | ✅ |
| `loanService` | ✅ | ✅ | `apiClient` | ✅ |
| `paymentService` | ✅ | ✅ | `apiClient` | ✅ |
| `transactionService` | ✅ | ✅ | `apiClient` | ✅ |
| `reconciliationService` | ✅ | ✅ | `apiClient` | ✅ |
| `adjustmentService` | ✅ | ✅ | `apiClient` | ✅ |
| `groupService` | ✅ | ✅ | `apiClient` | ✅ |
| `collectorService` | ✅ | ✅ | `apiClient` | ✅ |
| `collectorManagementService` | ✅ | ✅ | `apiClient` | ✅ |
| `dashboardService` | ✅ | ✅ | `apiClient` | ✅ |
| `loanPoolService` | ✅ | ✅ | `apiClient` | ✅ |
| `riskFlagService` | ✅ | ✅ | `apiClient` | ✅ |
| `reportService` | ✅ | ✅ | `apiClient` | ✅ |
| `settingsService` | ✅ | ✅ | `apiClient` | 🔄 Users CRUD mock-only; system settings read |
| `notificationService` | ✅ | ✅ | `apiClient` | ✅ (backend delivers SMS) |
| `auditService` | ✅ | ✅ | `apiClient` | ✅ |
| `searchService` | ✅ | ✅ | `apiClient` | ✅ |
| `overpaymentReviewService` | ✅ | ✅ | `apiClient` | ✅ |

**Switch:** `src/services/index.ts` → `index.development.ts` | `index.production.ts`

### Mocks

- In-memory stores with reset helpers for tests
- Factories for reference-scale datasets (dashboard, groups, collectors, risk flags)
- `simulateDelay()` mimics network latency
- **Gap:** Production stubs untested against real API (no contract tests)

### State

| Store | Purpose | Backend impact |
|---|---|---|
| `authStore` | Session user + role | Must align with server session/JWT claims |
| `shellLayoutStore` | Sidebar collapse | Client-only ✅ |
| `themeStore` | Light/dark | Client-only ✅ |
| `uiStore` | Drawers, modals | Client-only ✅ |
| `offlineQueueStore` | Collector payments | Requires idempotent `POST /payments` + replay API |
| `appLockStore` | PIN lock | Client-only ✅ |
| TanStack Query | Server cache | Standard — invalidate on mutation |

### API architecture (`apiClient`)

- JSON GET/POST/PATCH only
- Cookie credentials, 401 → session expired handler
- **Missing:** `DELETE`, multipart/form-data (photo upload), file download streams, cursor pagination helpers

### Authentication

- Login: Next.js BFF `POST /api/auth/login` (httpOnly cookie)
- Production services: `apiClient` to `API_BASE_URL`
- **Risk:** Two base URLs; production must unify or proxy BFF → API gateway

### Role permissions

- Middleware role gates on route groups ✅
- `RoleGuard` client-side ✅
- **Gap:** REQ-086 full RBAC matrix E2E not complete; data scoping (collector sees own borrowers only) enforced in mock, must be server-enforced

### Exports

- Client-side PDF/Excel/CSV/Print via `src/features/export/` ✅
- Data re-fetched through services before export ✅
- **Gap:** Large reports may need server-side export endpoints

### Reports

- 9 report types in catalog ✅
- Filters: date range, status — mostly service-driven
- **Gap:** `AuditLogReportPanel`, `DailyCollectionReportPanel` use `DEMO_ACCOUNTS` for filter options

### Forms

- RHF + Zod across registration, loans, payments, reconciliation ✅
- Async validators wired to service checks ✅
- **Gap:** Photo upload mock only; no multipart production path

### Search / pagination / filtering

- Omnibar `searchService` ✅
- URL-synced filters (Applications `?status=PENDING`) ✅
- Page-size constants from reference-scale files ✅
- **Gap:** Standardise query param names in OpenAPI before backend

### Notifications

- `INotificationService.sendNotification` abstraction ✅
- Mock delivery log; real SMS/email on backend

### File uploads

- `PhotoUploadField` validates type/size ✅
- Mock stores base64 locally
- **Missing:** `POST /borrowers/photo` multipart implementation in production `borrowerService`

### GPS

- Captured in payment entry; included in mock payload ✅
- Production: verify field names in `POST /payments` contract

### Camera

- `capture="user"` on photo input ✅
- No native camera SDK — browser API sufficient

### Signature capture

- **Not implemented** — REG-ENH deferred; export placeholders only

### Offline mode / PWA

- Queue + background sync registration ✅
- Service worker + manifest ✅
- **Risk:** Replay ordering and conflict resolution need server idempotency keys

---

## Missing API contracts

| Endpoint | BRD / REQ | Status |
|---|---|---|
| `POST /audit/registration-flag` | REQ-013 | Not in frontend production stub |
| `POST /transactions/withdrawal` | REQ-046 | Not implemented |
| `PATCH /borrowers/[id]/flag-deceased` | REQ-064 | Not implemented |
| `PATCH /loans/reschedule` | REQ-067 | Not implemented |
| `PATCH /groups/[id]/dissolve` | REQ-071 | Not implemented |
| `POST /borrowers/photo` (multipart) | REQ-007 | Stub missing multipart |
| `GET /settings` + `PATCH /settings` | Settings sections | Read mock only |
| OpenAPI / JSON Schema bundle | All | **Not published** |

---

## Frontend refactor checklist (pre-cutover)

1. Remove `DEMO_ACCOUNTS` from report filter panels → service list endpoints
2. Move `utils/collector-management-list.ts`, `utils/defaulter-report.ts` logic into services
3. Add `apiClient.delete` + `apiClient.upload` helpers
4. Implement production `settingsService.updateSettings`
5. Contract tests: mock response shapes === OpenAPI schemas
6. E2E against staging API for REQ-036, 041–042, 063, 078–081

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Session/auth split (BFF vs API) | High | High | Single auth gateway; document cookie forwarding |
| Offline replay duplicates | Medium | High | Idempotency-Key header on payments |
| Utils mock imports leak to prod bundle | Low | Medium | ESLint boundary + build-time check |
| Missing encryption (REQ-087) | N/A frontend | High | Backend assumption; document in security review |
| Admin fee amount ambiguity (AMB-001) | Medium | Medium | Business sign-off before fee config API |

---

## Readiness score breakdown

```
Services & hooks     █████████████████░░░  85%
API client           ████████████░░░░░░░░  60%
Auth/session         ███████████████░░░░░  75%
Forms & validation   ████████████████░░░░  80%
Reports & exports    ██████████████░░░░░░  70%
Edge cases           ████████░░░░░░░░░░░░  40%
PWA/offline          ████████████████░░░░  80%
NFR / security       ██████████░░░░░░░░░░  50%
─────────────────────────────────────────
Weighted overall     ██████████████░░░░░░  ~72%
```

**Recommendation:** Complete sidebar/dashboard polish (this pass), resolve report filter violations, publish OpenAPI v1, then staged integration starting with read-only endpoints (dashboard, reports GET) before mutating flows.
