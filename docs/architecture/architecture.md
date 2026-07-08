# WILMS — Architecture
> Women's Interest-Free Loan Management System | Frontend Architecture Reference

---

## 1. Architecture Philosophy

WILMS is a **transaction-first, role-based** system. Every balance, status, and report is derived purely from verified transaction records — no manual balance entries, no computed fields stored as mutable state. This shapes every architectural decision:

- **Read-heavy dashboards** derived from the transaction ledger at query time
- **Write operations** always produce a new transaction record (never mutate a balance directly)
- **Role-based rendering** — the UI structurally differs per role; restricted content is never merely hidden, it is never fetched or rendered
- **Offline-first Collector UX** — the Collector interface must function on 3G and survive connectivity loss

---

## 2. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for fast initial load on 3G; file-based routing maps cleanly to role-based pages |
| Language | TypeScript (strict mode) | Required for financial data integrity; eliminates class of runtime errors |
| Styling | Tailwind CSS | Utility-first; no CSS bundle bloat; consistent design tokens |
| State Management | Zustand | Lightweight; no boilerplate; easy offline queue management |
| Forms | React Hook Form + Zod | Performant uncontrolled forms; schema-driven validation matches BRD rules |
| Server State | TanStack Query | Caching, background refetch, optimistic updates; pairs with offline sync |
| Unit/Integration Tests | Vitest + React Testing Library | Fast; native ESM; aligned with Vite/Next.js ecosystem |
| E2E Tests | Playwright | Cross-browser; mobile viewport simulation for Collector UX |

**No deviations from the default stack.** The BRD does not mandate a different technology.

---

## 2.1 Design System Architecture

The WILMS UI is token-driven.

All colors, typography, spacing, borders, radii, status indicators, and layouts must originate from the Design System.

No component may use hardcoded styling values.

Theme support:

- Light Theme (Field Experience)
- Executive Dark Theme (Admin Experience)

Theme selection may be:
- Role-based
- User preference
- System preference

All themes must share the same semantic token names.

---

## 3. Dependency Registry

Every dependency must be documented here. No dependency may be added without a row in this table.

| Package | Purpose | Justified By |
|---|---|---|
| next | App framework | Core requirement |
| react / react-dom | UI rendering | Core requirement |
| typescript | Type safety | Code standards |
| tailwindcss | Styling | Design system |
| zustand | Global state | State ADR-001 |
| react-hook-form | Form management | Complex multi-step registration forms |
| zod | Schema validation | BRD validation rules (duplicate detection, required fields) |
| @tanstack/react-query | Server state + caching | Offline sync, background refetch |
| vitest | Unit testing | Testing requirements |
| @vitest/coverage-v8 | Coverage reporting + thresholds (QA-02) | Definition of Done |
| @testing-library/react | Component tests | Testing requirements |
| @testing-library/user-event | User interaction simulation in component tests | Testing requirements |
| playwright | E2E tests | Testing requirements |
| jspdf | PDF export engine | WILMS Export & Reporting Standard (`context/export-strategy.md`) |
| jspdf-autotable | Branded PDF tables | WILMS Export & Reporting Standard |
| exceljs | Branded Excel workbooks | WILMS Export & Reporting Standard |

---

## 3.1 Export & Reporting Architecture

All exports use the shared framework at `src/features/export/`. See `context/export-strategy.md`.

| Engine | Module | Output |
|---|---|---|
| CSV | `engines/csv-engine.ts` | Metadata preamble + human-readable columns |
| Excel | `engines/excel-engine.ts` | Multi-sheet branded workbook |
| PDF | `engines/pdf-engine.ts` | Official A4 documents via jsPDF |
| Print | `engines/print-engine.ts` | Dedicated HTML print templates (never `window.print()` on app shell) |

Domain pages build a `WilmsExportDocument` via builders; UI uses `ExportCsvButton` or `WilmsExportActions`.

See `context/adrs/ADR-001-state-management.md` for the full decision record.

### State Ownership

| State Domain | Owner | Rationale |
|---|---|---|
| Auth / Session / Role | Zustand `authStore` | Must persist across route changes; drives all role-based rendering |
| Offline Payment Queue | Zustand `offlineQueueStore` | Must survive navigation; synced on reconnection |
| UI State (modals, toasts, drawers) | Zustand `uiStore` | Global notification system for reconciliation alerts, supervisor alerts |
| Borrower / Loan / Transaction data | TanStack Query | Server state; cached with stale-while-revalidate; invalidated on mutations |
| Form state | React Hook Form (local) | Controlled locally; never hoisted to global store |

### Offline Queue Strategy (v1.3.0)
1. Collector records payment while offline → action pushed to `offlineQueueStore` (localStorage)
2. Photos/attachments → IndexedDB upload queue (`upload-queue.ts`)
3. UI shows pending count via `OfflineBanner`
4. On reconnection or service worker `sync` event, queue drains in FIFO order
5. Financial operations → `POST /sync/offline/batch` → approver review at `/approver/sync-conflicts`
6. Upload queue drained by `BackgroundUploadProcessor` when online
7. Sync respects collector auto-sync interval and pauses during battery saver mode

See `docs/offline-architecture.md` and `docs/synchronization-guide.md`.

---

## 5. Folder Structure

```
src/
├── app/                        ← Next.js App Router pages and layouts
│   ├── (auth)/                 ← Login, session-expired pages
│   ├── (super-admin)/          ← Super Admin role shell
│   │   ├── dashboard/
│   │   ├── borrowers/
│   │   ├── loans/
│   │   ├── collectors/
│   │   ├── groups/
│   │   ├── reports/
│   │   ├── audit-log/
│   │   ├── adjustments/
│   │   └── settings/
│   ├── (collector)/            ← Collector role shell (mobile-first)
│   │   ├── dashboard/
│   │   ├── my-borrowers/
│   │   ├── payment/
│   │   └── reconciliation/
│   ├── (registration-officer)/ ← Registration Officer role shell
│   │   ├── register/
│   │   └── my-registrations/
│   └── (approver)/             ← Approver role shell
│       ├── pending/
│       └── reviewed/
├── layouts/                    ← Role-specific shell layouts
├── features/                   ← Self-contained feature modules
│   ├── auth/
│   ├── borrower-registration/
│   ├── borrower-approval/
│   ├── loan-management/
│   ├── payment-collection/
│   ├── reconciliation/
│   ├── group-management/
│   ├── collector-performance/
│   ├── financial-reports/
│   ├── audit-log/
│   └── notifications/
├── components/                 ← Shared, reusable UI components
│   ├── ui/                     ← Primitives: Button, Input, Badge, Modal, etc.
│   ├── data-display/           ← Table, StatCard, ProgressBar, StatusBadge
│   ├── forms/                  ← FormField, FormSection, FileUpload
│   └── feedback/               ← Toast, Alert, EmptyState, LoadingSpinner
├── hooks/                      ← Custom React hooks
├── services/                   ← API service layer (mock/real switch here only)
├── state/                      ← Zustand stores
├── mocks/                      ← Mock data and mock services (dev only)
├── types/                      ← TypeScript type definitions
├── utils/                      ← Utility functions
│   └── logger.ts               ← Logging abstraction (never console.log in feature code)
├── constants/                  ← App-wide constants (loan statuses, roles, etc.)
├── config/                     ← Environment and app configuration
├── assets/                     ← Static assets
├── styles/                     ← Global styles and design tokens
└── tests/                      ← Test files mirroring src structure
context/                        ← Project context files (this folder)
AGENTS.md                       ← Agent entry point
```

---

## 6. Data Flow

```
User Interaction
  → Component event handler
  → React Hook Form (for forms) OR direct handler
  → Zod validation (schema check against BRD rules)
  → TanStack Query mutation OR Zustand action
  → src/services/ (ONLY location that knows mock vs real)
    → DEV: src/mocks/ service (mock data, simulated delay)
    → PROD: Real API endpoint (env variable URL)
  → Response handling
  → TanStack Query cache invalidation / Zustand store update
  → Component re-render
```

**Mock isolation rule:** Components, hooks, and state stores **never** import from `src/mocks/` directly. Only `src/services/` switches between implementations.

---

## 7. Role-Based Access Control (Frontend)

RBAC is enforced at three levels:

1. **Route level** — App Router middleware checks session role; unauthenticated or wrong-role requests are redirected, not blocked with CSS
2. **Layout level** — Each role shell renders only its permitted navigation items
3. **Component level** — Restricted actions (e.g., Adjustment button) check role from `authStore` and return `null` — never just hidden

**Authorization rule:** Hiding content is insufficient. Restricted UI elements must not be rendered at all. Restricted data must not be fetched at all.

---

## 8. Security Architecture

| Concern | Mitigation |
|---|---|
| XSS | No `dangerouslySetInnerHTML`; all user content escaped via React default rendering |
| Token exposure | Auth tokens stored in httpOnly cookies only — never localStorage |
| Sensitive data in URL | ID numbers, phone numbers, GPS never passed as query params |
| Environment secrets | All API keys server-side only; never in client bundle |
| Collector fraud | GPS + timestamp auto-captured; same-day edit alerts; reconciliation required |
| Session expiry | TanStack Query auth error → redirect to login; offline queue preserved |

---

## 9. Performance Architecture

| Concern | Strategy |
|---|---|
| 3G load time | Route-based code splitting; no unused imports; image optimization |
| Large borrower lists | Virtualization (react-virtual or equivalent) for lists > 100 items |
| Dashboard render | Memoized selectors; derived data computed once |
| Offline sync | TanStack Query offline mode; queue drain on reconnect |
| Bundle size | Production build excludes all mock data and mock services |

---

## 10. Observability Abstractions

| Concern | Abstraction | Location |
|---|---|---|
| Logging | `logger.ts` | `src/utils/logger.ts` |
| Analytics | `analytics.ts` | `src/services/analytics.ts` |
| Error tracking | `errorTracking.ts` | `src/services/errorTracking.ts` |

Feature code never calls `console.log`, Sentry, or analytics SDKs directly. All calls route through these abstractions.
