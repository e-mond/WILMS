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
| Frontend UI | **Certified** | 42 routes; **205/205** unit tests (`docs/page-validation/phase-5a.3-evidence/` — RC0 re-run PASS) |
| Backend API | **Certified** | Express on `:4000`; **11/11** tests (`docs/page-validation/phase-5a.3-evidence/test-backend.txt`) |
| Financial core | **Certified** | `verify:financial` **64/64** ×2 on shared Neon (`phase-5a.3-evidence/verify-financial-run*.txt`) |
| Live integration | **Certified** | `verify:live` **23/23** ×2 (`phase-5a.3-evidence/verify-live-run*.txt`) |
| Neon / Drizzle | **Operational** | Migrations `0000`–`0006`; seed when `DATABASE_URL` set |
| Security | **Certified** | Pre-5B hardening + 5B re-verify **11/11** (`P14.3B-phase-5b-security-certification.md`) |
| Production certification | **RC0 complete** | P14.5A.3 — **CONDITIONAL** (`P14.5A.3-release-candidate.md`) |
| P14.3B — Loan Pools | **Certified** | Phase 1 — `verify:pools` 5/5 |
| P14.3B — Adjustments | **Certified** | Phase 2 — `verify:adjustments` 10/10 |
| P14.3B — Payment Reversal | **Certified** | functional 10/10, concurrency PASS; perf measured (Neon latency) |
| P14.3B — Reconciliation | **Certified** | functional 24/24, RBAC 6/6, concurrency PASS |
| P14.3B — Uploads | **Certified** | `cert:upload:env` + `cert:upload:smoke` PASS (Cloudinary) |
| Notifications (SMS/email) | **Deferred** | Adapters only; no workflow call sites (`docs/audit/P14.3B-feature-completion-matrix.md`) |
| **Current phase** | **P14.5G** | Production hardening v0.2.1 — CSRF, health expansion, release docs |

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
│   ├── page-validation/   Phase audit and certification reports
│   └── audit/             Pre-5B project audit (P14.3B)
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

Development defaults to **mock services** unless `NEXT_PUBLIC_API_BASE_URL` is set and either `NODE_ENV=production` or `NEXT_PUBLIC_USE_MOCK=false` (`apps/frontend/src/data-provider/types.ts`).

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
| Unit | Vitest 2.1 — frontend **205** tests; backend **9** tests |
| E2E | Playwright 1.48 — **61** tests across 14 spec files (Chromium) |
| Financial | Custom harness — `verify:financial` (backend) |

### Monorepo

npm workspaces + Turbo (`build`, `type-check`, `lint`, `test`)

---

## Current Domain Coverage

### Completed (backend + frontend)

| Domain | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Authentication | `/auth/*` | Login, session, middleware | HMAC-signed sessions + bcrypt (`b68f3eb`) |
| RBAC | `requirePermission` | `PermissionProvider` | Security harness **11/11**; reconciliation RBAC **6/6** |
| Borrowers | `/borrowers/*` | `/borrowers` | |
| Registration | Partial API | `/officer/register` | |
| Approvals | Loan approve/reject | `/approver/*` | |
| Groups | `/group-formation` | `/groups` | |
| Uploads | `/uploads/*` | Photo flows | Local disk (dev) or Cloudinary (prod) |
| Audit | `/audit/*` | Audit log reports | Async best-effort writes |
| Reports | `/reports/*` | `/reports/*` | Partial backend parity |
| Loans | `/loans/*` | `/loans` | Full lifecycle |
| Loan lifecycle | Service + schema | Status mapping | 5 frontend statuses |
| Repayment engine | `/payments` | Collector payment UI | Exact weekly rules |
| Ledger | `ledger_entries` | Financial reports | |
| Idempotency | Disburse + payment POST | — | Unique-index race handled |
| Concurrency | Optimistic `version` | — | Harness: perf + concurrency gaps on Neon |
| **Loan Pools** | `GET /loan-pools`, `GET /loan-pools/:id` | `/loan-pools` | Phase 1 read API; `verify:pools` |
| **Adjustments** | `GET/POST /adjustments`, `GET /adjustments/pending`, approve/reject | `/adjustments` | Phase 2 workflow; `verify:adjustments` |
| **Payment Reversal** | `POST .../reverse`, reversal service | Approver flows | Phase 3C — `cert:reversal:*` certified |
| **Reconciliation** | `POST /reconciliation`, collector submit | `/reconciliation` | Phase 4C/4D — `cert:reconciliation:*` certified |

### Deferred (P14.3B — remaining)

| Domain | Status |
|--------|--------|
| Other reversal types | Deferred by design — MVP payment reversal only |
| Write-Offs | Partial via adjustment `WRITE_OFF` type; dedicated service deferred |
| Financial Controls | Partial RBAC; admin fee not server-enforced on loan create/disburse |
| Pool disburse/payment hooks | Schema ready; writers deferred |
| OTP / password reset | Not implemented — documented deferral (`docs/audit/P14.3B-security-audit.md`) |
| SMS / email notification workflows | Infrastructure adapters only; Hubtel UI label, backend: Arkesel/Twilio |

Detail: `docs/page-validation/P14.3B-remaining-work-roadmap.md` (current) · historical: `P14.3B-readiness-assessment.md`

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
# For live API in dev without production build: NEXT_PUBLIC_USE_MOCK=false (see .env.local.example)
# Or: build frontend with NODE_ENV=production for live API mode
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
| `NEXT_PUBLIC_USE_MOCK` | No | unset | Set `false` for live API in development (requires API URL) |
| `NEXT_PUBLIC_WILMS_ENV` | No | — | Export label (staging vs production) |
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
| `WILMS_CORS_ORIGIN` | Prod: yes | `http://127.0.0.1:3000` | CORS origin |
| `WILMS_SESSION_SECRET` | Prod: yes (≥32 chars) | dev fallback if unset | HMAC session signing — required when `NODE_ENV=production` |
| `WILMS_UPLOAD_DIR` | No | `.wilms-uploads` | Local upload path |
| `WILMS_MIN_GROUP_SIZE` | No | `5` | Group formation |
| `WILMS_MAX_GROUP_SIZE` | No | `15` | Group formation |
| `NODE_ENV` | No | `development` | Runtime mode |

### Uploads

| Variable | Required | Default |
|----------|----------|---------|
| `UPLOAD_PROVIDER` | No | `local` — use `cloudinary` in production |
| `CLOUDINARY_CLOUD_NAME` | When cloudinary | — |
| `CLOUDINARY_API_KEY` | When cloudinary | — |
| `CLOUDINARY_API_SECRET` | When cloudinary | — |
| `CLOUDINARY_FOLDER` | No | `wilms` |
| `UPLOAD_MAX_SIZE_BYTES` | No | `10485760` |
| `UPLOAD_ALLOWED_MIME_TYPES` | No | jpeg,png,webp,pdf |

See [docs/engineering/cloudinary-setup.md](docs/engineering/cloudinary-setup.md) for setup. **P14.5A.3:** `cert:upload:env` and `cert:upload:smoke` PASS with Cloudinary configured (`phase-5a.3-evidence/`).

```bash
npm run cert:upload:env -w @wilms/api   # Validate upload configuration (secrets masked)
```

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

**Product target:** Hubtel (shown in settings UI). **Runtime backend** supports `SMS_PROVIDER=none`, `arkesel`, or `twilio` only (`apps/backend/src/infrastructure/sms/config.ts`). Hubtel adapter not yet implemented.

| Variable | Required | Default |
|----------|----------|---------|
| `SMS_PROVIDER` | No | `none` |
| `ARKESEL_API_KEY`, `ARKESEL_SENDER_ID` | When `arkesel` | — |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | When `twilio` | — |

### E2E / Playwright

| Variable | Required | Default |
|----------|----------|---------|
| `PLAYWRIGHT_BASE_URL` | No | derived from host+port |
| `PLAYWRIGHT_HOST` / `E2E_HOST` | No | `127.0.0.1` |
| `PLAYWRIGHT_PORT` / `FRONTEND_PORT` / `E2E_PORT` | No | `3000` |
| `CI` | No | — | Disables server reuse, enables retries |

Full inventory: `docs/page-validation/P14.3A.3-environment-discovery.md` · latest audit: `P14.3B-environment-audit.md`

---

## Testing

```bash
npm run type-check          # TypeScript — frontend + backend
npm run lint                # ESLint — frontend
npm run build               # Next.js production build (42 routes)
npm run test                # Vitest — frontend 205 tests (2 shards)
npm run test -w @wilms/api  # Backend unit tests (9)
npm run test:e2e            # Playwright E2E (use CI=1 in CI)
npm run verify:live -w @wilms/api        # Live integration (5B gate: 16/17)
npm run verify:financial -w @wilms/api   # Financial harness
npm run verify:pools -w @wilms/api       # Loan pool integrity (P14.3B Phase 1)
npm run verify:adjustments -w @wilms/api # Financial adjustments (P14.3B Phase 2)
npm run verify:reversals -w @wilms/api   # Payment reversal (P14.3B Phase 3C.1)
npm run perf:baseline -w @wilms/api      # Performance baseline (P14.3B)
npm run perf:reversals -w @wilms/api     # Reversal latency simulation (P14.3B Phase 3C.1)
npm run cert:reversal:seed-reset -w @wilms/api  # 3C.2 — reset harness pollution on shared Neon
npm run cert:reversal:env -w @wilms/api         # 3C.2 — environment probe
npm run cert:reversal:functional -w @wilms/api  # 3C.2 — live functional cert
npm run cert:reversal:ledger -w @wilms/api      # 3C.2 — ledger integrity cert
npm run cert:reversal:concurrency -w @wilms/api # 3C.2 — concurrency cert
npm run cert:reversal:perf -w @wilms/api        # 3C.2 — performance cert (100/500/1000)
npm run cert:reconciliation:seed-reset -w @wilms/api  # 4C.4 — reset cert reconciliation rows
npm run cert:reconciliation:env -w @wilms/api         # 4C.4 — environment probe
npm run cert:reconciliation:functional -w @wilms/api  # 4C.4 — functional + idempotency + integrity
npm run cert:reconciliation:rbac -w @wilms/api       # 4C.4 — RBAC cert
npm run cert:reconciliation:concurrency -w @wilms/api # 4C.4 — concurrency cert
npm run cert:reconciliation:perf -w @wilms/api        # 4C.4 — performance cert (100/500/1000)
npm run cert:demo:stakeholder -w @wilms/api            # 4D.2 — end-to-end demo workflow cert
```

| Command | Validates |
|---------|-----------|
| `npm run test` | Frontend unit tests (205) |
| `npm run test -w @wilms/api` | Backend unit tests (9) |
| `npm run verify:live` | Auth, RBAC, Neon persistence, loan workflows (requires API + seed) |
| `npm run test:e2e` | Role journeys, accessibility, responsive shells, PWA |
| `npm run verify:financial` | Unit calculations, RBAC HTTP checks, DB ledger/concurrency/idempotency (requires `DATABASE_URL` + seed) |
| `npm run verify:pools` | Pool balance integrity + list/detail API checks |
| `npm run verify:adjustments` | Adjustment workflow, ledger, history integrity |
| `npm run perf:baseline` | Latency baseline for loan/portfolio/report queries |

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

Set secrets in the deployment platform — never commit `.env`. Required in production: `DATABASE_URL`, `WILMS_SESSION_SECRET` (≥32 chars), `WILMS_CORS_ORIGIN`, and Cloudinary credentials when using `UPLOAD_PROVIDER=cloudinary`. See `apps/backend/.env.production.example` and `apps/frontend/.env.production.example`.

Detail: `docs/deployment-guide.md` · `docs/security-guide.md` · `docs/production-guide.md` · `docs/page-validation/P14.5G-deployment-report.md`

### Live production (P14.5G — v0.2.1)

| Service | URL |
|---------|-----|
| Frontend | https://wilms.vercel.app |
| API | https://wilms-production.up.railway.app |

Deploy from **monorepo root** (`railway up` / `vercel deploy --prod`). Smoke: `WILMS_APP_URL=https://wilms.vercel.app WILMS_API_URL=https://wilms-production.up.railway.app npm run smoke:production`


---

## Current Production Readiness

**Authority:** P14.5A.3 Release Candidate Zero (`docs/page-validation/P14.5A.3-release-candidate.md`).  
**Verdict:** **CONDITIONAL** — financial core is certified; full-portal production requires scope acceptance and DevOps sign-off.

| Area | Rating | Evidence |
|------|--------|----------|
| Application (frontend + backend) | **Certified** | type-check, lint, build PASS; backend **11/11** (`phase-5a.3-evidence/`) |
| Financial domains (reversal, reconciliation) | **Certified** | functional, RBAC, concurrency PASS |
| Financial harness (`verify:financial`) | **Certified** | **64/64** ×2 |
| Live integration (`verify:live`) | **Certified** | **23/23** ×2 |
| Security controls | **Certified** | **11/11** harness (`P14.3B-phase-5b-security-certification.md`) |
| Uploads (Cloudinary) | **Certified** | `cert:upload:env` + `cert:upload:smoke` PASS |
| Performance certs (100-batch) | **Conditional** | Reversal measured (Neon ETIMEDOUT); reconciliation perf failed DNS during RC0 |
| V1 scope (mock-only pages) | **Open** | 16+ admin/collector routes 404 in live API mode — P14.4A V2 deferral |
| Staging / HTTPS / CORS | **Blocked** | RC-054/055 — not validated in staging |
| Human release sign-off | **Blocked** | RC-058 — Product/Ops approval pending |
| Production deployment | **Conditional** | Financial-core-only deploy viable with documented scope boundaries |

Full blocker matrix: `docs/page-validation/P14.5A.3-release-candidate.md`

**Historical:** Phase 5B scores (`50/63`, `16/17`) superseded by P14.5A.1/P14.5A.3 evidence.

---

## Known Limitations

- **Mock-backed domains** — Dashboard, collectors, settings, notifications, search, and risk flags use mock services in development. Loans, payments, adjustments, loan pools, reversals, and reconciliation use live API when `NEXT_PUBLIC_USE_MOCK=false` (or production build) with backend running.
- **V1 live scope** — 16+ UI routes call backend paths with no implementation (404 in live mode). Deploy financial-core routes only, or defer full-portal live deploy to V2 (`P14.4A-version1-scope.md`).
- **Report stubs** — Five report types return empty rows from backend stubs (loan portfolio, defaulters, ledger, collector performance, group risk).
- **Loan pools** — Backend read API available in API mode; disburse/payment pool attribution not wired yet.
- **Dev default** — `npm run dev` uses mocks unless `NEXT_PUBLIC_USE_MOCK=false` and `NEXT_PUBLIC_API_BASE_URL` are set (see `.env.local.example`).
- **Health endpoint** — Production `/health` includes DB, migrations, uploads, version, and uptime probes (P14.5A).
- **Shared Neon certification** — Remote latency and connection timeouts affect perf batches; run `cert:reversal:seed-reset` or `cert:reconciliation:seed-reset` before repeated cert runs.
- **Audit writes** — Best-effort async; not transactional with business operations.
- **Admin fee gate** — Enforced in mock UI only; not server-validated on loan create/disburse.
- **HTTPS / CORS / trust proxy** — Require staging validation and deploy-time config (`WILMS_CORS_ORIGIN`, `WILMS_TRUST_PROXY`).
- **Deferred domains** — Other reversal types, dedicated write-offs, OTP, password reset, SMS/email workflows — see `P14.3B-remaining-work-roadmap.md`.

---

## Documentation Index

| Phase | Key documents |
|-------|---------------|
| **P14.1** Discovery | `P14.1A-domain-inventory.md`, `P14.1B-database-blueprint.md`, `P14.1C-domain-model.md`, `P14.1D-workspace-decision.md` |
| **P14.2** Database | `P14.2-frontend-contract-verification.md` |
| **P14.3A** Financial core | `P14.3A-loan-lifecycle-report.md`, `P14.3A-repayment-engine-report.md`, `P14.3A-financial-safety-audit.md` |
| **P14.3A.1** Verification | `P14.3A.1-financial-verification.md`, `P14.3A.1-security-review.md` |
| **P14.3A.2–4** Certification | `P14.3A.4-production-certification.md` (historical) |
| **P14.3B** Features | Reversal, reconciliation, Cloudinary — see `P14.3B-reconciliation-architecture.md` |
| **P14.3B Phase 5A** | `P14.3B-phase-5a-deployment-guide.md`, `P14.3B-phase-5a-release-validation.md` |
| **P14.3B Phase 5B** | `P14.3B-phase-5b-production-certification.md`, `P14.3B-phase-5b-release-approval.md` |
| **Pre-5B audit** | `docs/audit/P14.3B-final-readiness.md`, `P14.3B-security-audit.md`, `P14.3B-feature-completion-matrix.md` |
| **Doc alignment (current)** | `P14.3B-readme-audit.md`, `P14.3B-production-readiness-review.md`, `P14.3B-remaining-work-roadmap.md` |
| **P14.3C Release readiness** | `P14.3C-release-dashboard.md`, `P14.3C-executive-summary.md` — page/API/RBAC coverage (46 pages; 41% live-API-safe) |
| **P14.4 Release candidate** | `P14.4I-release-decision.md`, `P14.4-executive-summary.md` — V1 scope freeze; **NOT READY** for production |
| **P14.5A Production hardening** | `P14.5A-release-readiness.md`, `P14.5A-validation-report.md` |
| **P14.5A.1 Financial closure** | `P14.5A.1-financial-certification-closure.md`, `P14.5A.1-release-readiness.md` |
| **P14.5A.2 Release freeze audit** | `P14.5A.2-executive-summary.md`, `P14.5A.2-risk-register.md` |
| **P14.5A.3 Release Candidate Zero** | **`P14.5A.3-release-candidate.md`** — **CONDITIONAL** (canonical RC0) |
| **Releases** | `docs/releases/P14.3B-Phase-5A.md`, `P14.3B-Phase-5B.md` |

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/engineering/branching-strategy.md](docs/engineering/branching-strategy.md) for phase workflow standards.


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
