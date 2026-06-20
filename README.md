# WILMS

**Women's Interest-Free Loan Management System** — a TypeScript monorepo for interest-free microfinance: borrower onboarding, group formation, loan lifecycle, weekly collections, audit trails, and role-based reporting.

Repository: [github.com/e-mond/WILMS](https://github.com/e-mond/WILMS)

---

## Project Overview

WILMS supports registration officers, approvers, collectors, auditors, and super administrators operating women's group lending programs in Ghana and similar markets.

### Business purpose

- Register and approve borrowers with structured KYC profiles
- Form and manage lending groups
- Originate, approve, disburse, and track loans
- Record weekly repayments with strict allocation rules
- Maintain audit trails and financial reporting
- Enforce RBAC across all operations

### Implementation status (evidence-based)

| Area | Status | Evidence |
|------|--------|----------|
| Frontend UI | **Operational** | 42 routes, 400 unit tests, Playwright E2E suite |
| Backend API | **Operational** | Express on `:4000`, RBAC + `{ data }` envelopes |
| Financial core | **Operational** | Loan lifecycle, repayment engine, ledger, idempotency |
| Neon / Drizzle | **Operational** | Migrations apply; seed loads when `DATABASE_URL` set |
| Production certification | **Partial (82%)** | `docs/page-validation/P14.3A.4-production-certification.md` |
| P14.3B — Loan Pools | **Certified (warnings)** | Phase 1 — `verify:pools` 5/5; see `P14.3B-phase-1-certification.md` |
| P14.3B — Adjustments | **Next** | Phase 2 authorized — see `P14.3B-adjustment-architecture-review.md` |
| P14.3B — Other domains | **Not started** | Reversals, reconciliation, write-offs mock-only |

---

## Architecture Overview

```text
wilms/
├── apps/
│   ├── frontend/          @wilms/frontend — Next.js 14 App Router UI
│   └── backend/           @wilms/api — Express API + Drizzle + Neon
├── packages/
│   ├── shared-contracts/  Domain enums and contract constants
│   ├── shared-rbac/       Roles and permission constants
│   ├── shared-types/      Cross-cutting TypeScript types
│   ├── shared-validation/ Zod schemas (login, API validation)
│   └── shared-utils/      Shared helpers
├── docs/
│   └── page-validation/   Phase audit and certification reports
├── .env.example           Monorepo environment reference
├── package.json           npm workspaces root scripts
└── turbo.json             Turbo task graph
```

### Responsibilities

| Path | Role |
|------|------|
| `apps/frontend/src/app/` | Next.js routes, BFF proxy (`/api/wilms`), auth routes |
| `apps/frontend/src/services/` | Domain services; mock vs API via webpack alias |
| `apps/backend/src/modules/` | HTTP routes + domain services per bounded context |
| `apps/backend/src/repositories/` | Drizzle persistence (PostgreSQL when `DATABASE_URL` set) |
| `apps/backend/src/domain/` | Pure financial logic (loan calculations, payment allocation) |
| `apps/backend/src/infrastructure/` | Upload providers, mail/SMS adapters, idempotency, audit |
| `apps/backend/src/db/` | Schema, migrations, seed, Neon client |
| `apps/backend/src/verification/` | Financial verification harness (P14.3A.1) |
| `packages/*` | Shared contracts consumed by both apps — no HTTP or env access |
| `docs/page-validation/` | Evidence-based phase documentation |

### Request flow (production mode)

```text
UI → @/services → apiClient → NEXT_PUBLIC_API_BASE_URL
  → Next.js BFF /api/wilms/* → WILMS_API_UPSTREAM
  → Express modules → repositories → Neon PostgreSQL
```

Development defaults to **mock services** unless `NODE_ENV=production` and `NEXT_PUBLIC_API_BASE_URL` are both set.

---

## Technology Stack

### Frontend

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 14.2 | App Router |
| React | 18.3 | |
| TypeScript | 5.6 | |
| Tailwind CSS | 3.4 | |
| TanStack Query | 5.59 | Server state |
| Zustand | 5.0 | Client state |
| Zod | 3.23 | Validation |

### Backend

| Technology | Version | Notes |
|------------|---------|-------|
| Node.js | 20+ | |
| **Express** | 4.21 | Verified — not Fastify |
| TypeScript | 5.6 | |
| Zod | 3.23 | Request validation |

### Database

| Technology | Notes |
|------------|-------|
| PostgreSQL | Neon serverless |
| Drizzle ORM | 0.38 — schema + migrations |
| `@neondatabase/serverless` | WebSocket pool |

### Testing

| Layer | Tool |
|-------|------|
| Unit | Vitest 2.1 (frontend, 400 tests) |
| E2E | Playwright 1.48 (186 scenarios, Chromium) |
| Financial | Custom harness — `verify:financial` (backend) |

### Monorepo

npm workspaces + Turbo (`build`, `type-check`, `lint`, `test`)

---

## Current Domain Coverage

### Completed (backend + frontend)

| Domain | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Authentication | `/auth/*` | Login, session, middleware | Demo session tokens |
| RBAC | `requirePermission` | `PermissionProvider` | 6/6 harness checks pass |
| Borrowers | `/borrowers/*` | `/borrowers` | |
| Registration | Partial API | `/officer/register` | |
| Approvals | Loan approve/reject | `/approver/*` | |
| Groups | `/group-formation` | `/groups` | |
| Uploads | `/uploads/*` | Photo flows | Local + Cloudinary infra |
| Audit | `/audit/*` | Audit log reports | Async best-effort writes |
| Reports | `/reports/*` | `/reports/*` | Partial backend parity |
| Loans | `/loans/*` | `/loans` | Full lifecycle |
| Loan lifecycle | Service + schema | Status mapping | 5 frontend statuses |
| Repayment engine | `/payments` | Collector payment UI | Exact weekly rules |
| Ledger | `ledger_entries` | Financial reports | |
| Idempotency | Disburse + payment POST | — | Unique-index race handled |
| Concurrency | Optimistic `version` | — | Harness: perf + concurrency gaps on Neon |
| **Loan Pools** | `GET /loan-pools`, `GET /loan-pools/:id` | `/loan-pools` | Phase 1 read API; seed + `verify:pools` |

### Deferred (P14.3B — remaining)

| Domain | Status |
|--------|--------|
| Adjustments | UI mock — no backend module |
| Reversals | Not implemented |
| Reconciliation | UI mock — no backend module |
| Write-Offs | Enum/hook only — no dedicated service |
| Financial Controls | Partial RBAC; admin fee not server-enforced |
| Pool disburse/payment hooks | Schema ready; writers deferred to Phase 2+ |

Detail: `docs/page-validation/P14.3B-readiness-assessment.md`

---

## Local Development Setup

### Prerequisites

- Node.js 20+, npm 9+
- Neon account (optional — backend falls back to in-memory store)

### Install

```bash
npm install
```

### Frontend

```bash
npm run dev -w @wilms/frontend
# http://localhost:3000 — mock data active in development
```

### Backend

```bash
npm run dev:api
# http://127.0.0.1:4000 — expect [postgresql (Neon)] or [in-memory]
```

Backend auto-loads environment from root `.env` via `apps/backend/src/config/load-env.ts`.

### Database

```bash
# Copy and edit env first (see Environment Variables)
npm run db:migrate -w @wilms/api
npm run db:seed -w @wilms/api
```

### Full-stack local (optional)

```bash
cp .env.example .env
cp apps/backend/.env.local.example apps/backend/.env.local
cp apps/frontend/.env.local.example apps/frontend/.env.local
# Set DATABASE_URL in .env / apps/backend/.env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api/wilms in frontend .env.local
# Build frontend with NODE_ENV=production for live API mode
```

---

## Environment Variables

Reference files (never commit secrets):

| File | Purpose |
|------|---------|
| `.env.example` | Monorepo reference — all variables |
| `apps/frontend/.env.example` | Frontend subset |
| `apps/frontend/.env.local.example` | Local overrides (copy to `.env.local`) |
| `apps/frontend/.env.production.example` | Production deployment |
| `apps/backend/.env.example` | Backend subset |
| `apps/backend/.env.local.example` | Local secrets (`DATABASE_URL`) |
| `apps/backend/.env.production.example` | Production deployment |

### Frontend

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Prod API: yes | `""` | API client base URL |
| `NEXT_PUBLIC_APP_URL` | No | — | Public app URL |
| `WILMS_API_UPSTREAM` | No | `http://127.0.0.1:4000` | BFF proxy target |
| `NEXT_PUBLIC_DEMO_MODE` | No | — | Force mock |
| `NEXT_PUBLIC_FORCE_DEMO_MODE` | No | — | Force mock |
| `NEXT_PUBLIC_API_DISABLED` | No | — | Force mock |
| `NEXT_PUBLIC_WILMS_ENV` | No | — | Export label |
| `NEXT_PUBLIC_APP_LOCK_IDLE_MS` | No | 300000 | App lock idle ms |
| `NODE_ENV` | No | `development` | Runtime mode |

### Backend

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Prod: yes | unset → in-memory | Neon connection string |
| `WILMS_API_PORT` | No | `4000` | Listen port |
| `API_PORT` | No | — | Alias for port |
| `PORT` | No | — | Platform alias |
| `WILMS_API_HOST` | No | `127.0.0.1` | Bind address |
| `WILMS_CORS_ORIGIN` | No | `http://127.0.0.1:3000` | CORS origin |
| `WILMS_UPLOAD_DIR` | No | `.wilms-uploads` | Local upload path |
| `WILMS_MIN_GROUP_SIZE` | No | `5` | Group formation |
| `WILMS_MAX_GROUP_SIZE` | No | `15` | Group formation |
| `NODE_ENV` | No | `development` | Runtime mode |

### Uploads

| Variable | Required | Default |
|----------|----------|---------|
| `UPLOAD_PROVIDER` | No | `local` |
| `CLOUDINARY_CLOUD_NAME` | When cloudinary | — |
| `CLOUDINARY_API_KEY` | When cloudinary | — |
| `CLOUDINARY_API_SECRET` | When cloudinary | — |
| `CLOUDINARY_FOLDER` | No | `wilms` |
| `UPLOAD_MAX_SIZE_BYTES` | No | `10485760` |
| `UPLOAD_ALLOWED_MIME_TYPES` | No | jpeg,png,webp,pdf |

### Mail (infrastructure only)

| Variable | Required | Default |
|----------|----------|---------|
| `MAIL_PROVIDER` | No | `none` |
| `MAIL_FROM` | No | `noreply@wilms.local` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP | — |
| `SMTP_PORT` | No | `587` |
| `SMTP_SECURE` | No | `false` |
| `RESEND_API_KEY` | Resend | — |

### SMS (infrastructure only)

| Variable | Required | Default |
|----------|----------|---------|
| `SMS_PROVIDER` | No | `none` |
| `ARKESEL_API_KEY`, `ARKESEL_SENDER_ID` | Arkesel | — |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Twilio | — |

### E2E / Playwright

| Variable | Required | Default |
|----------|----------|---------|
| `PLAYWRIGHT_BASE_URL` | No | derived from host+port |
| `PLAYWRIGHT_HOST` / `E2E_HOST` | No | `127.0.0.1` |
| `PLAYWRIGHT_PORT` / `FRONTEND_PORT` / `E2E_PORT` | No | `3000` |
| `CI` | No | — | Disables server reuse, enables retries |

Full inventory: `docs/page-validation/P14.3A.3-environment-discovery.md`

---

## Testing

```bash
npm run type-check          # TypeScript — frontend + backend
npm run lint                # ESLint — frontend
npm run build               # Next.js production build (42 routes)
npm run test                # Vitest unit tests (400 tests, 2 shards)
npm run test:e2e            # Playwright E2E (use CI=1 in CI)
npm run verify:financial -w @wilms/api   # Financial harness
npm run verify:pools -w @wilms/api       # Loan pool integrity (P14.3B)
npm run perf:baseline -w @wilms/api      # Performance baseline (P14.3B)
```

| Command | Validates |
|---------|-----------|
| `npm run test` | UI components, services, utils, auth, payment rules |
| `npm run test:e2e` | Role journeys, accessibility, responsive shells, PWA |
| `npm run verify:financial` | Unit calculations, RBAC HTTP checks, DB ledger/concurrency/idempotency (requires `DATABASE_URL` + seed) |
| `npm run verify:pools` | Pool balance integrity + list/detail API checks (requires `DATABASE_URL` + seed) |
| `npm run perf:baseline` | Latency baseline for loan/portfolio/report queries (P14.3B Phase 0) |

**E2E tip:** `CI=1 PLAYWRIGHT_PORT=3010 npm run test:e2e` avoids port conflicts with `npm run dev`.

---

## Deployment

### Neon setup

1. Create project at [console.neon.tech](https://console.neon.tech)
2. Copy **pooled** connection string → `DATABASE_URL`
3. Run migrations and seed on first deploy

### Build and start

```bash
npm run build                          # Frontend
npm run start -w @wilms/frontend       # Serve Next.js
npm run start -w @wilms/api            # Backend API
```

### Migration and seed

```bash
npm run db:migrate -w @wilms/api
npm run db:seed -w @wilms/api          # First deploy only
npm run verify:financial -w @wilms/api # Post-deploy verification
npm run verify:pools -w @wilms/api     # After P14.3B pool migration/seed
```

### Production environment

Set secrets in the deployment platform — never commit `.env`. See `apps/backend/.env.production.example` and `apps/frontend/.env.production.example`.

Detail: `docs/page-validation/P14.3A.3-environment-governance.md`

---

## Current Production Readiness

From `docs/page-validation/P14.3A.4-production-certification.md` + P14.3B Phase 1 (evidence-based):

| Domain | Score |
|--------|-------|
| Frontend build & tests | 95% |
| Backend financial core (code) | 92% |
| Neon schema deployment | 90% |
| Live integration proof | 85% |
| Financial harness (full green) | 70% |
| P14.3B Phase 1 (loan pools) | **88%** — certified with warnings |
| P14.3B remaining domains | **0%** (adjustments, reversals, reconciliation, write-offs) |
| Security / ops | 80% |
| **Overall** | **84% — partial certification** |

**Not fully certified.** Remaining: financial harness 60/60 green, live UI in API mode, P14.3B Phase 2–5 domains.

---

## Known Limitations

- **Mock-backed domains** — Dashboard, collectors, adjustments, reconciliation, settings, notifications, search, and risk flags use mock services in development.
- **Loan pools** — Backend read API available in production API mode; disburse/payment pool attribution not wired yet.
- **Dev isolation** — `npm run dev` always uses mocks; live API requires production build + env configuration.
- **Financial harness** — 58/60 checks pass; Neon latency p95 checks fail remotely.
- **Audit writes** — Best-effort async; not transactional with business operations.
- **Demo sessions** — Not cryptographically signed; not production-grade auth.
- **Admin fee gate** — Enforced in mock UI only; not server-validated on loan create/disburse.
- **P14.3B remainder** — Adjustments, reversals, reconciliation, write-offs not implemented on backend.

---

## Documentation Index

| Phase | Key documents |
|-------|---------------|
| **P14.1** Discovery | `P14.1A-domain-inventory.md`, `P14.1B-*`, `P14.1C-*`, `P14.1D-workspace-decision.md` |
| **P14.2** Database | `P14.2-frontend-contract-verification.md` |
| **P14.3A** Financial core | `P14.3A-loan-lifecycle-report.md`, `P14.3A-repayment-engine-report.md`, `P14.3A-financial-safety-audit.md` |
| **P14.3A.1** Verification | `P14.3A.1-financial-verification.md`, `P14.3A.1-security-review.md`, `P14.3A.1-concurrency-audit.md`, `P14.3A.1-idempotency-audit.md` |
| **P14.3A.2** Certification | `P14.3A.2-system-certification.md`, `P14.3A.2-neon-verification.md`, `P14.3A.2-integration-verification.md` |
| **P14.3A.3** Env hardening | `P14.3A.3-environment-governance.md`, `P14.3A.3-env-loading-audit.md`, `P14.3A.3-api-architecture.md`, `P14.3A.3-upload-architecture.md`, `P14.3A.3-readme-update-report.md` |
| **P14.3A.4** Live certification | `P14.3A.4-production-certification.md`, `P14.3A.4-backend-live-verification.md` |
| **P14.3B** | `P14.3B-phase-1-certification.md`, `P14.3B-adjustment-architecture-review.md`, `P14.3B-performance-baseline.md`, `P14.3B-pool-architecture-review.md`, `P14.3B-loan-pools-report.md`, `P14.3B-readiness-assessment.md` |

All paths under `docs/page-validation/`.

---

## Quick Commands

```bash
npm run dev              # Frontend (mock in development)
npm run dev:api          # Backend API
npm run build            # Production frontend build
npm run type-check       # TypeScript both apps
npm run lint             # ESLint
npm run test             # Unit tests
npm run test:e2e         # Playwright E2E
npm run db:migrate -w @wilms/api
npm run db:seed -w @wilms/api
npm run verify:financial -w @wilms/api
npm run verify:pools -w @wilms/api
npm run verify:live -w @wilms/api
npm run perf:baseline -w @wilms/api
```

---

## License

Private — not for public distribution unless explicitly released.
