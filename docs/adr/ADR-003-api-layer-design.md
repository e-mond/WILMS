# ADR-003 — API Layer Design

**Status:** Accepted
**Date:** Phase 2, May 2026

---

## Context

WILMS's frontend must be fully functional during development with no backend connection (Demo Mode, mock data), and must connect exclusively to real API endpoints in production. The switch between mock and real must be:

- **Automatic** — driven entirely by `NODE_ENV`; no manual toggle
- **Zero component impact** — components, hooks, and state stores must be unaware of whether they are talking to mock or real services
- **Bundle-clean** — the production build must contain zero mock data or mock service code

Additionally, WILMS has specific API concerns:
- **Financial integrity** — all write operations must be confirmed by the server before UI updates; no optimistic UI for financial mutations
- **GPS capture** — payment transactions must include client-captured GPS coordinates
- **Offline queue** — payment mutations from the offline queue must replay faithfully when connectivity resumes
- **Audit sensitivity** — adjustment and approval endpoints must log the acting user identity server-side; the frontend must always send the authenticated session, never a user-supplied ID

---

## Decision

### Service Layer as the Sole Switching Point

All API communication is encapsulated in `src/services/`. The service layer is the **only** location in the codebase that knows whether it is using mock or real implementations.

```
src/services/
├── index.ts               ← Exports the correct implementation (mock or real)
├── borrowerService.ts     ← Real API implementation
├── loanService.ts
├── paymentService.ts
├── reconciliationService.ts
├── reportService.ts
├── notificationService.ts
├── auditService.ts
└── mock/
    ├── borrowerService.mock.ts
    ├── loanService.mock.ts
    ├── paymentService.mock.ts
    └── ...
```

`src/services/index.ts` switches at build time:

```typescript
// src/services/index.ts
const isMock = process.env.NODE_ENV === 'development';

export const borrowerService = isMock
  ? (await import('./mock/borrowerService.mock')).default
  : (await import('./borrowerService')).default;
```

Because this uses dynamic imports, the production bundle tree-shakes out all mock service modules entirely.

### API Interface Contract

Every service (mock or real) implements the same TypeScript interface defined in `src/types/services.ts`. This guarantees that swapping mock for real requires zero changes outside `src/services/`.

### Financial Mutation Policy

- **No optimistic updates for financial mutations** (payments, disbursements, adjustments, withdrawals). The UI shows a loading state; it updates only on confirmed server response. This prevents false balance displays.
- **Confirmed optimistic updates are acceptable** only for non-financial UI actions (e.g., marking a notification as read).

### GPS Capture

The `paymentService` is responsible for capturing GPS before sending the payment mutation:

```typescript
async recordPayment(payload: RecordPaymentInput): Promise<PaymentTransaction> {
  const coords = await captureGPS(); // throws if denied — caller handles error
  return apiClient.post('/payments', { ...payload, gps: coords });
}
```

The component is not responsible for GPS capture — it only handles the error state if GPS is denied.

### Offline Queue Replay

When the `offlineQueueStore` drains on reconnection, it calls `paymentService.recordPayment()` for each queued item in FIFO order. The service layer handles the replay transparently. The component that originally submitted the payment receives a `pendingSync` status until the queue item is confirmed.

### API Client

A shared `apiClient` utility in `src/utils/apiClient.ts` handles:
- Base URL from `process.env.NEXT_PUBLIC_API_BASE_URL`
- Auth token attachment (reads from httpOnly cookie via Next.js server action — never from client localStorage)
- Response parsing and error mapping to user-facing `ApiError` types
- Timeout handling (10 second default; configurable per call)

---

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| Direct `fetch` calls in components | No single switching point; mock vs real logic spreads across codebase |
| Axios interceptors for auth | Axios adds ~14kb to bundle; native `fetch` with a thin wrapper is sufficient for WILMS's API surface |
| GraphQL | BRD does not require it; adds complexity without benefit for WILMS's REST-oriented data model |
| MSW (Mock Service Worker) for mocking | MSW intercepts at the network level; cleaner for testing but requires a service worker; adds complexity for the offline PWA scenario where the service worker is already in use for offline caching |
| Optimistic updates for payments | Rejected on financial integrity grounds — a failed optimistic update could show an incorrect balance to the Collector, leading to under-collection |

---

## Trade-offs

| What is gained | What is sacrificed |
|---|---|
| Single file change to switch entire app from mock to real | Service layer must be kept in sync with API contract changes |
| Zero mock code in production bundle | Requires discipline — components must never import from `src/mocks/` directly |
| Financial integrity (no premature balance updates) | Payment UX has a loading state; no instant confirmation feel |
| GPS captured at service layer | Component must handle GPS denied error gracefully |

---

## Consequences

- Any new API endpoint requires: a type definition in `src/types/`, a real service method in `src/services/`, and a mock service method in `src/services/mock/`
- The `src/mocks/` directory contains **only static mock data** (borrowers, schedules, etc.) — never service logic. Service logic lives in `src/services/mock/`
- The `apiClient` must never read the auth token from client-accessible storage (no `localStorage.getItem('token')`)
- GPS denial must show a user-facing error and block payment submission — it must never silently proceed without coordinates
- Adjustment and approval mutations must never allow client-supplied `userId` fields — the server derives acting user from the session
