# WILMS — API Coverage Report

**Audit date:** 2026-07-04 · **Commit:** `487708b`

---

## Summary

| Metric | Count |
|--------|-------|
| Route modules | 28 |
| HTTP handlers (business + auth + health) | **158** |
| Dual-mounted paths | Each business route at `/api/v1/*` and `/*` |
| Direct HTTP integration tests | **~6 checks** in `collector-portal/rbac.test.ts` |
| Service-layer tests | 14 files, 52 tests |
| Routes with no backend test reference | **~140+** |
| Known stubs | 1 (`GET /locations/current`) |
| Dev-only memory fallbacks | notifications, expenses, photo-capture, settings/roles |

---

## Registration architecture

```
createApp() → apps/backend/src/http/app.ts
  /health, /auth/*           (root only)
  mountBusinessRoutes('/api/v1')
  mountBusinessRoutes('')    (duplicate mount)
```

---

## Module endpoint counts

| Module | Routes | Primary frontend consumer |
|--------|--------|---------------------------|
| Borrowers | 25 | Registration wizard, borrower list/profile, approver review |
| Settings | 23 | SettingsPanel, RoleSettingsPanel, integrations |
| Loans | 13 | Loan portfolio, create loan, loan detail |
| Groups | 12 | Groups management, group profile |
| Reports | 8 | ReportsIndexPanel + 8 report panels |
| Adjustments | 6 | AdjustmentsPanel |
| Payments | 6 | PaymentEntryPanel, payment edit |
| Risk flags | 6 | RiskFlagsPanel |
| Reconciliation | 5 | ReconciliationForm |
| Notifications | 5 | NotificationInboxPanel |
| Locations | 5 | Registration address step |
| Uploads | 5 | PhotoUpload, DocumentUpload, signatures |
| Expenses | 4 | CollectorExpenseForm |
| Photo capture | 4 | PhotoUploadField, `/capture/[token]` |
| Sync | 4 | Offline batch (partial UI) |
| Messages | 4 | Limited UI surfacing |
| Loan pools | 3 | LoanPoolsPanel |
| Collectors | 3 | CollectorsManagementPanel |
| Group formation | 3 | Approval workflow group creation |
| Overpayment reviews | 3 | OverpaymentReviewPanel |
| Auth | 2 | Login BFF |
| Audit | 2 | AuditLogReportPanel |
| Collector portal | 2 | CollectorDashboardPanel |
| Health | 1 | Deploy verification |
| Dashboard | 1 | SuperAdminDashboard, collector dashboard |
| Analytics | 1 | Dashboard widgets |
| Search | 1 | GlobalSearchPanel |
| Transactions | 1 | Admin fee recording |

---

## Endpoint status categories

| Status | Definition | Examples |
|--------|------------|----------|
| **Live + used** | Implemented, proxied via BFF, frontend calls | `/dashboard/summary`, `/borrowers`, `/settings` |
| **Live + tested (HTTP)** | RBAC smoke or rbac.test.ts | `/collector/:id/dashboard`, `/notifications/inbox/unread-count` |
| **Live + service tested** | Unit tests on service layer | `listLoanPools`, `listRiskFlags`, guarantor eligibility |
| **Stub** | Returns placeholder data | `GET /locations/current` → `{0,0}` |
| **Feature-gated** | 404 when env missing | `GET /uploads/signature` without Cloudinary |
| **Memory fallback** | Works without DB in dev | notifications inbox, expenses |
| **Dead / unused** | **Not systematically verified** | Requires frontend service grep per route — deferred |
| **Deprecated** | None documented in code | — |
| **Missing (frontend expects)** | **None confirmed** in production smoke (BFF proxies 200) | Prior `/settings/integrations/status` fixed via embedded status |

---

## Production smoke — BFF proxy results (2026-07-04)

All returned **HTTP 200** when authenticated as admin:

- `/api/wilms/loans`
- `/api/wilms/reports`
- `/api/wilms/settings/me`
- `/api/wilms/dashboard/summary`
- `/api/wilms/groups`
- `/api/wilms/loan-pools`
- `/api/wilms/risk-flags`
- `/api/wilms/messages/threads`
- `/api/wilms/collectors`
- `/api/wilms/borrowers`
- `/api/wilms/loans/portfolio`

Unauthenticated `/loans` → **401** (expected).

---

## `verify:api-coverage` script

**Failed locally** — `ENOENT` writing to `docs/page-validation/RC1-api-coverage.md` (path excluded by sparse checkout). Script logic scans frontend placeholders and pages; **not re-executed to completion** this audit.

---

## Recommendations

1. Add HTTP integration test suite covering top 20 BFF paths per role
2. Replace `GET /locations/current` stub with real geolocation or remove from UI
3. Document intentionally unused routes or remove dead handlers
4. Re-run `npm run verify:api-coverage` on full checkout in CI

---

## Sample route detail (high-traffic)

| Route | Method | Controller file | Status |
|-------|--------|-----------------|--------|
| `/api/v1/borrowers` | GET | `modules/borrowers/routes.ts` | Live, smoke 200 |
| `/api/v1/borrowers/drafts` | POST | same | Live, no HTTP test |
| `/api/v1/settings/integrations/status` | GET | `modules/settings/routes.ts` | Live; also embedded in GET `/settings` |
| `/api/v1/registration/capture-sessions` | POST | `modules/photo-capture/routes.ts` | Live, RBAC test |
| `/health` | GET | `modules/health/routes.ts` | Live, deploy sync |

Full 158-route inventory captured in repository scan (see audit agent transcript / `apps/backend/src/modules/*/routes.ts`).
