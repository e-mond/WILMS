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
| Frontend UI | **RC1.4** | Next.js on Vercel; unified export modal; readable IDs in UI |
| Backend API | **RC1.4** | Express on Railway; Ghana locations DB; SMS workflow wiring |
| Neon / Drizzle | **Operational** | Migrations `0000`–`0012` (Ghana locations); seed when `DATABASE_URL` set |
| Notifications (SMS/email) | **Partial** | Payment, missed-payment, and approval SMS wired; test endpoints + smoke script |
| Ghana locations | **RC1.4** | DB tables + bundled seeds (`npm run seed:ghana-locations`); JSON fallback offline |
| **Current phase** | **RC1.4 closure** | Audit 2026-07-04 — `main` @ `487708b`; see `PROJECT_READINESS_REPORT.md` and `FINAL_RECOMMENDATION.md` |

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

### Display IDs and production data

Management screens show human-readable IDs from the API (`displayId`, `groupSystemId`, `collectorCode`) — not raw UUIDs:

| Entity | Format example | Source |
|--------|----------------|--------|
| Borrower | `BWR-ACCR-202605-0001` | `displayId` on borrower records |
| Collector | `COL-001` | `collectors.collector_code` (seeded in `db:seed:reference`) |
| Group | `GRP-ACC-202603-001` | `groups.system_id` |
| Loan | `LOAN-CYCLE1JA-202605-0002` | Derived from `cycleBatch` + `startDate` |
| Pool | `POOL-GRE-001` | Derived from `region` + sequence |
| User | `USR-000001` or staff ID | `displayId` on settings users |
| Payment | `TXN-20260704-001` | `displayId` on payment records |
| Risk flag entity | `ENT-BOR-...` | Derived when `entityId` is a UUID |

Ghana region/district/city dropdowns use `/locations/*` (DB when seeded, bundled JSON fallback). See `docs/engineering/ghana-locations.md`.

Remove demo financial rows from production with:

```bash
node apps/backend/scripts/cleanup-demo-financial-data.mjs --dry-run
node apps/backend/scripts/cleanup-demo-financial-data.mjs --execute
```

SMS/email copy is centralized in `apps/backend/src/infrastructure/notifications/templates.ts` with unit tests in `apps/backend/src/tests/notifications/templates.test.ts`.

**Browser console noise:** `background.js` / `proxy.js` errors (`disconnected port`, `Cannot destructure property 'url'`) come from browser extensions (password managers, devtools), not from WILMS application code.

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
| Unit | Vitest 2.1 — frontend unit tests; backend unit tests |
| E2E | Playwright 1.48 — role journeys, accessibility, responsive shells, PWA |
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
| SMS / email notification workflows | **Partial** — payment, missed-payment, and approval SMS wired; test endpoints + `smoke:notifications`; requires Railway env vars |
| OTP / password reset | Not implemented — documented deferral (`docs/audit/P14.3B-security-audit.md`) |

Detail: `docs/page-validation/P14.3B-remaining-work-roadmap.md` (current) · historical: `P14.3B-readiness-assessment.md`

---

## Local Development Setup

### Prerequisites

- Node.js 22+, npm 9+
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

### Mail (Gmail SMTP or Resend)

| Variable | Required | Default |
|----------|----------|---------|
| `MAIL_PROVIDER` | No | `none` — use `gmail`, `smtp`, or `resend` |
| `MAIL_FROM` | Prod recommended | `noreply@wilms.local` |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | When `gmail` | — (maps to SMTP automatically) |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | When `smtp` | Gmail defaults when `GMAIL_*` set |
| `SMTP_PORT` | No | `587` |
| `SMTP_SECURE` | No | `false` |
| `RESEND_API_KEY` | When `resend` | — |

Settings → Integrations shows live provider status via `GET /settings/integrations/status`. Test email fails with **422** until credentials are set on Railway.

### SMS (SMSNotifyGH recommended for Ghana)

**Product target:** SMSNotifyGH (settings UI label). **Runtime backend** supports `SMS_PROVIDER=none`, `smsnotifygh`, `arkesel`, or `twilio` (`apps/backend/src/infrastructure/sms/config.ts`).

| Variable | Required | Default |
|----------|----------|---------|
| `SMS_PROVIDER` | No | `none` |
| `SMSNOTIFYGH_API_KEY`, `SMSNOTIFYGH_SENDER_ID` | When `smsnotifygh` | — |
| `SMSNOTIFYGH_API_URL` | No | `https://sms.smsnotifygh.com/smsapi` |
| `ARKESEL_API_KEY`, `ARKESEL_SENDER_ID` | When `arkesel` | — |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | When `twilio` | — |

Test SMS fails with **422** until `SMS_PROVIDER` and matching credentials are set on Railway (see `apps/backend/.env.production.example`).

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
npm run test                # Vitest — frontend unit tests
npm run test -w @wilms/api  # Backend unit tests
npm run test:e2e            # Playwright E2E (use CI=1 in CI)
npm run verify:deploy-sync  # Compare local HEAD vs production /health
npm run seed:ghana-locations # Ghana MMDA seed (after migration 0012)
npm run smoke:notifications -w @wilms/api  # SMS/email smoke when credentials set
npm run clean:local         # Remove local caches and build artifacts
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
| `npm run test` | Frontend unit tests |
| `npm run test -w @wilms/api` | Backend unit tests |
| `npm run verify:deploy-sync` | Local git SHA vs production `/health.gitCommit` |
| `npm run smoke:notifications` | SMS/email provider smoke (requires credentials) |
| `npm run seed:ghana-locations` | Import Ghana region/district/community data |
| `npm run clean:local` | Clear `.next`, Turbo cache, Playwright artifacts |
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
npm run seed:ghana-locations           # After migration 0012 (Ghana MMDA data)
npm run verify:deploy-sync             # Compare local HEAD vs production /health
npm run smoke:notifications -w @wilms/api  # Test SMS/email when credentials set
npm run verify:financial -w @wilms/api # Post-deploy verification
```

### Production environment

Set secrets in the deployment platform — never commit `.env`. Required in production: `DATABASE_URL`, `WILMS_SESSION_SECRET` (≥32 chars), `WILMS_CORS_ORIGIN`, Cloudinary when `UPLOAD_PROVIDER=cloudinary`, and **SMS/mail credentials** for notification test buttons and automated SMS. See `apps/backend/.env.production.example`.

Detail: `docs/deployment-guide.md` · `docs/security-guide.md` · `docs/production-guide.md` · `docs/page-validation/P14.6-environment-and-credentials.md`

### Live production (current — v0.2.2)

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | https://wilms.vercel.app | Vercel — redeploy after `main` merge |
| API | https://wilms-production.up.railway.app | Railway — migrations **13/13**, Ghana seeded |

Set `WILMS_GIT_COMMIT` on Railway so `/health` reports the deployed SHA. Set `SMS_PROVIDER` + `MAIL_PROVIDER` on Railway for test SMS/email in Settings. Engineering docs: `docs/engineering/ghana-locations.md`, `docs/engineering/app-lock.md`. In-app link: Settings sidebar → **Project README**.

### P14.6.1 (superseded)

Historical investigation artifacts — see `docs/page-validation/P14.6.3-production-acceptance.md` for current production state.


---

## Current Production Readiness

**Authority:** RC1.4 v1.0 certification (`docs/page-validation/RC1.4-v1-certification.md`).  
**Verdict:** **CONDITIONAL** — financial core certified; notification providers require Railway env setup; full-portal scope boundaries unchanged from RC0.

| Area | Rating | Evidence |
|------|--------|----------|
| Application (frontend + backend) | **Certified** | type-check, lint, build PASS |
| Financial domains (reversal, reconciliation) | **Certified** | functional, RBAC, concurrency PASS |
| Ghana locations + readable IDs | **Implemented** | Migration 0012, export modal, display ID formatters |
| Notifications (SMS workflows) | **Partial** | Payment/missed/approval SMS wired; **422 until Railway env set** |
| Deploy sync | **Implemented** | `npm run verify:deploy-sync` |
| V1 scope (mock-only pages) | **Open** | Some admin/collector routes 404 in live API mode |
| Human release sign-off | **Blocked** | Product/Ops approval pending |

Historical RC0 matrix: `docs/page-validation/P14.5A.3-release-candidate.md`

---

## Known Limitations

- **Mock-backed domains** — Dashboard, collectors list, search, and risk flags may use mock services in development. Loans, payments, adjustments, loan pools, reversals, reconciliation, and settings use live API when `NEXT_PUBLIC_USE_MOCK=false` (or production build) with backend running.
- **V1 live scope** — Some UI routes call backend paths with no implementation (404 in live mode). Deploy financial-core routes only, or defer full-portal live deploy to V2 (`P14.4A-version1-scope.md`).
- **Report stubs** — Five report types return empty rows from backend stubs (loan portfolio, defaulters, ledger, collector performance, group risk).
- **Loan pools** — Backend read API available; disburse/payment pool attribution not wired yet.
- **Dev default** — `npm run dev` uses mocks unless `NEXT_PUBLIC_USE_MOCK=false` and `NEXT_PUBLIC_API_BASE_URL` are set (see `.env.local.example`).
- **SMS / email test (422)** — Settings test buttons require Railway env: `SMS_PROVIDER=smsnotifygh` + credentials, or `MAIL_PROVIDER=gmail` + `GMAIL_*`. UI shows provider status and setup hints; not a frontend bug.
- **Notification sounds** — Hook added; login/logout sound toggle pending in settings UI.
- **Shared Neon certification** — Remote latency affects perf batches; run seed-reset scripts before repeated cert runs.
- **Audit writes** — Best-effort async; not transactional with business operations.
- **Admin fee gate** — Enforced in mock UI only; not server-validated on loan create/disburse.
- **Ghana location coverage** — Seed bundles 16 regions and representative MMDA subset (not all ~261 districts).
- **Export modal** — Unified Export on report pages; borrower profile print unchanged; PDF photo thumbnails not yet implemented.
- **Operational mobile nav** — Collector, approver, auditor, and registration officer use floating pill nav on mobile; super-admin retains sidebar/drawer pattern.
- **Deferred domains** — OTP, password reset, approval email (SMS approval wired) — see `P14.3B-remaining-work-roadmap.md`.

---

## Documentation Index

Paths under `docs/page-validation/` unless noted.

| Phase | Key documents |
|-------|---------------|
| **P14.1** Discovery | `P14.1A-domain-inventory.md`, `P14.1B-database-blueprint.md`, `P14.1C-domain-model.md` |
| **P14.3A** Financial core | `P14.3A-loan-lifecycle-report.md`, `P14.3A-repayment-engine-report.md` |
| **P14.3B** Features | Reversal, reconciliation, Cloudinary — `P14.3B-reconciliation-architecture.md`, `P14.3B-remaining-work-roadmap.md` |
| **P14.5A** RC0 | **`P14.5A.3-release-candidate.md`** — historical CONDITIONAL RC0 |
| **RC1** Release hardening | `RC1-production-verification.md`, `RC1.3-final-certification.md` |
| **RC1.4** v1.0 certification | **`RC1.4-v1-certification.md`**, `RC1.4-production-verification.md`, `RC1.4-settings.md`, `RC1.4-navigation.md` |
| **Engineering** | `docs/engineering/ghana-locations.md`, `docs/engineering/app-lock.md`, `docs/engineering/cloudinary-setup.md` |
| **Deployment** | `docs/deployment-guide.md`, `docs/production-guide.md`, `docs/security-guide.md` |
| **Status** | `PROJECT_STATUS.md` (repo root) |

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
npm run seed:ghana-locations
npm run verify:deploy-sync
npm run verify:financial -w @wilms/api
npm run verify:pools -w @wilms/api
npm run verify:live -w @wilms/api
npm run smoke:notifications -w @wilms/api
npm run clean:local
npm run perf:baseline -w @wilms/api
```

---

## License

Private — not for public distribution unless explicitly released.
