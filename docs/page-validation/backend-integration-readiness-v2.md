# Backend Integration Readiness — P11b Update

> Assessment date: 2026-06-09 | Overall readiness: **~76%**

## 1. Is the frontend architecture ready?

**Mostly yes.** Service interfaces, React Query hooks, route guards, shell composition, and export engines are backend-ready. P11b added guarantor eligibility, photo capture sessions, registration legal config, expense summaries, and RBAC hooks without breaking the ADR-003 service boundary.

Remaining gaps: production photo upload multipart, websocket capture sync, normalized entity stores (borrowers/collectors as IDs not embedded names).

## 2. Pages relying on mock data

| Domain | Routes | Service |
|---|---|---|
| Dashboard | `/dashboard` | `dashboardService`, `collectionMetricsService`, `expenseService` |
| Borrowers | `/borrowers/*` | `borrowerService` |
| Registration | `/officer/*` | `borrowerService`, `photoCaptureSessionMock`, `settingsService` |
| Collectors | `/collectors`, `/collector/*` | `collectorService`, `expenseService` |
| Groups | `/groups/*` | `groupService` |
| Loan pools | `/loan-pools` | `loanPoolService` |
| Risk | `/risk-flags` | `riskFlagService` |
| Reports | `/reports/*` | `reportService` |
| Settings | `/settings` | `settingsService` |
| Approver | `/approver/*` | `borrowerService` |

## 3. Services needing API contracts (new in P11b)

| Service | Methods |
|---|---|
| Borrower | `checkGuarantorEligibility` |
| Settings | `getRegistrationLegalConfig`, `getRegistrationLoanPreview` |
| Expense | `getExpenseSummary` |
| Photo capture (new) | `createSession`, `getSession`, `uploadCapture` |

## 4. Expected endpoints (incremental)

```
POST   /borrowers/check-guarantor-eligibility
GET    /settings/registration-legal
GET    /settings/registration-loan-preview
GET    /expenses/summary
POST   /registration/capture-sessions
GET    /registration/capture-sessions/:token
POST   /capture/:token/upload
PATCH  /settings/users/:id/reset-password
PATCH  /settings/users/:id/reset-pin
GET    /permissions/me
```

## 5. Incomplete workflows

- Phone capture production loop
- Legal terms Super Admin editor
- Full role permission matrix editor
- User suspend/delete/reset flows (partial in Settings)
- Loan terms on registration from live application

## 6. Hardcoded data areas

See `mock-data-compliance-v3.md`. UI-level business constants removed in P11b dashboard/shell pass; quick action hrefs remain navigation config (acceptable).

## 7. State normalization needs

- Borrower/guarantor photos as file IDs post-upload
- Notification inbox keyed by user ID
- Permission matrix cached via React Query (`usePermissions`)

## 8. RBAC integration

| Layer | Status |
|---|---|
| Permission catalog | Mock in `mocks/roles-permissions.ts` |
| Role definitions | Settings service |
| Runtime checks | `usePermissions` + `PermissionGate` (not yet page-wide) |
| Middleware | Role-based route prefixes only |
| Backend JWT claims | Not integrated |

## Readiness verdict

Proceed with backend sprint on borrower registration package, capture sessions, and RBAC endpoints first. Dashboard and reporting can follow once auth/permissions API is stable.
