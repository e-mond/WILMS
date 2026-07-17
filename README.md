# WILMS

**Women's Interest-Free Loan Management System** — a TypeScript monorepo for borrower onboarding, group lending, loan lifecycle management, weekly collections, expense tracking, audit trails, and role-based reporting.

| | |
|---|---|
| **Current version** | `1.3.8` (see root `package.json` ? `NEXT_PUBLIC_APP_VERSION` in the UI) |
| **Frontend** | Next.js 14 App Router, React, TanStack Query, Tailwind |
| **API** | Express, Drizzle ORM, Neon PostgreSQL |
| **Production** | [wilms.vercel.app](https://wilms.vercel.app) · API on Railway |

---

## What WILMS Does

WILMS supports the full microfinance operations loop for interest-free group lending:

1. **Registration** — officers capture borrower KYC, guarantor data, photos, and registration agreements.
2. **Approval** — approvers review pending applications, assign groups/collectors, and export structured agreement documents.
3. **Disbursement & loans** — loan pools, disbursements, schedules, fees, and portfolio reporting.
4. **Collections** — collector dashboards, payment entry, reconciliation, GPS verification, and offline queueing.
5. **Governance** — risk flags, adjustments, audit log, communication center, and executive reporting.
6. **Administration** — user/role management, system settings, integrations (SMS/email), and expense approvals.

---

## Portals & Roles

| Role | Home route | Primary capabilities |
|------|------------|----------------------|
| **Super Admin** | `/dashboard` | Full portfolio, collectors, groups, risk, reports, settings, communication center, **expense management** |
| **Collector** | `/collector/dashboard` | Payments, reconciliation, expenses, borrowers, offline sync |
| **Registration Officer** | `/officer/register` | Borrower registration wizard, my registrations queue |
| **Approver** | `/approver/pending` | Application review, sync conflict resolution |
| **Auditor** | `/auditor/reports` | Read-only reports and audit log |

### Demo accounts (development / seeded environments)

| Email | Password | Role |
|-------|----------|------|
| `admin@wilms.demo` | `DemoAdmin1!` | Super Admin |
| `collector@wilms.demo` | `DemoCollect1!` | Collector |
| `officer@wilms.demo` | `DemoOfficer1!` | Registration Officer |
| `approver@wilms.demo` | `DemoApprove1!` | Approver |
| `auditor@wilms.demo` | `DemoAudit1!` | Auditor |

---

## Repository Structure

```text
wilms/
??? apps/
?   ??? frontend/          # Next.js UI + /api/wilms BFF proxy
?   ??? backend/           # Express API, Drizzle schema, verification harnesses
??? packages/              # Shared RBAC, contracts, validation, utilities
??? data/ghana-locations/  # Ghana region/district seed data
??? docs/                  # Architecture, deployment, operations guides
??? scripts/               # Verification, bundle budget, cleanup scripts
??? package.json           # npm workspace root (version source of truth)
```

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js 20+**
- **npm** (workspaces)
- Optional: PostgreSQL connection string for persistent API mode

### Install & configure

```bash
git clone https://github.com/e-mond/WILMS.git
cd WILMS
npm install
cp .env.example .env
```

Edit `.env` with your local values. **Never commit `.env` files.**

### Run the stack

**Terminal 1 — API**

```bash
npm run dev:api
# Default: http://127.0.0.1:4000
```

**Terminal 2 — Frontend**

```bash
npm run dev
# Default: http://127.0.0.1:3000
```

The frontend proxies API calls through `/api/wilms/*` to `WILMS_API_UPSTREAM`.

### Data modes

| Mode | When | Behaviour |
|------|------|-----------|
| **Mock (default dev)** | `NEXT_PUBLIC_USE_MOCK` unset in dev webpack alias | In-browser mock services, no DB required |
| **API + memory** | `DATABASE_URL` unset on API | Backend in-memory persistence |
| **API + PostgreSQL** | `DATABASE_URL` set | Full production persistence |

Production builds **always** use the API data provider; mock mode is blocked at compile time.

---

## Environment Variables

Copy from `.env.example`. Key groups:

### Frontend

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (links, callbacks) |
| `NEXT_PUBLIC_API_BASE_URL` | Leave empty to use same-origin BFF proxy |
| `NEXT_PUBLIC_USE_MOCK` | Force API vs mock in non-production builds |
| `NEXT_PUBLIC_WILMS_ENV` | Display label: `development` / `staging` / `production` |
| `WILMS_API_UPSTREAM` | BFF proxy target (e.g. `http://127.0.0.1:4000`) |

### Backend / database

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `WILMS_SESSION_SECRET` | Session signing secret (required in production) |
| `WILMS_CORS_ORIGIN` | Allowed browser origin for direct API calls |

### Integrations (configure in Railway/Vercel secrets)

| Variable | Purpose |
|----------|---------|
| `SMS_PROVIDER` / `SMSNOTIFYGH_*` | SMSNotifyGH outbound SMS |
| `MAIL_PROVIDER` / `GMAIL_*` / `RESEND_API_KEY` | Transactional email |
| `UPLOAD_PROVIDER` / `CLOUDINARY_*` | Photo and document uploads |
| `WILMS_VERCEL_MAIL_URL` + `WILMS_INTERNAL_MAIL_SECRET` | Vercel Gmail relay from Railway API |

Integration status is surfaced in **Settings ? Integrations** with setup hints when credentials are missing.

---

## Core Commands

```bash
# Quality gates
npm run type-check          # Frontend + API TypeScript
npm run lint                # ESLint (frontend)
npm test                    # Vitest (frontend, 230+ tests)
npm run test -w @wilms/api  # API unit tests

# Build
npm run build               # Production Next.js build

# Database
npm run db:migrate -w @wilms/api
npm run seed:ghana-locations

# Production verification (requires live URLs)
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production

npm run smoke:rbac
npm run verify:api-integrity
npm run verify:mock-guard
npm run verify:deploy-sync
npm run verify:empty-db
```

---

## Architecture

```text
Browser
  ??? Next.js frontend (Vercel)
        ??? React UI (role-based shells, executive layout system)
        ??? BFF /api/wilms/*  ???  Express API (Railway)
                                      ??? Drizzle ORM
                                      ??? Neon PostgreSQL
                                      ??? Cloudinary uploads
                                      ??? SMS / mail providers
                                      ??? Audit + messaging modules
```

- **Readable display IDs** — borrowers, collectors, groups, loans, and payments show human-facing IDs in UI and exports; UUIDs stay internal.
- **RBAC** — permissions enforced in UI (`PermissionGate`) and API middleware; route matrix in `apps/frontend/src/lib/rbac/permission-matrix.ts`.
- **Exports** — unified WILMS export framework (CSV, Excel, PDF, Word, print) with branded registration agreement layouts.

---

## Key Features by Area

### Super Admin dashboard (`/dashboard`)

Executive KPIs, group risk snapshot, quick actions, **financial overview** (collections vs expenses), borrower status distribution, collector performance, and recent activity alerts.

### Expense management (`/expenses`)

Dedicated sidebar entry for super admins. Review collector-submitted expenses, approve/reject pending items, and monitor spend totals. Collectors submit via `/collector/expenses`.

### Settings (`/settings`)

Organisation branding, user management, roles & permissions, security, notifications, loan rules, SMS, integrations, and audit controls. Toggle switches use a visible outer frame when off for clearer affordance.

### Field operations (collectors)

- Offline payment and expense queue (IndexedDB)
- PWA installable shell
- Background photo uploads
- Device health in collector settings
- QR/barcode borrower lookup
- Thermal receipt printing

See `docs/offline-architecture.md`, `docs/mobile-guide.md`, and `docs/synchronization-guide.md`.

### Communication Center (`/communication-center`)

Broadcasts, templates, delivery analytics, and failed-message review across Email, SMS, and In-App channels.

### Registration & approval exports

Registration review screens export structured **PDF / Word / Print** agreement documents (not raw CSV dumps). Approver and officer review pages use `buildRegistrationAgreementExportDocument`.

---

## Deployment

### API (Railway)

```bash
railway up --detach
```

Set `DATABASE_URL`, `WILMS_SESSION_SECRET`, SMS/mail/upload secrets in Railway variables. Run migrations after deploy:

```bash
npm run db:migrate -w @wilms/api
```

### Frontend (Vercel)

```bash
vercel deploy --prod --yes
```

Set `WILMS_API_UPSTREAM` to the Railway API URL. Gmail credentials live on Vercel when using the mail relay.

### Post-deploy checks

```bash
# Health
curl -sS "${WILMS_API_URL}/health" | jq .

# Photo capture public route (must not 401)
curl -sS -o /dev/null -w "%{http_code}\n" \
  "${WILMS_APP_URL}/api/wilms/photo-capture/sessions/pcs_invalid00000001"
```

Full procedures: `docs/deployment-guide.md`, `docs/production-guide.md`.

---

## Release History (recent)

| Version | Highlights |
|---------|------------|
| **v1.3.8** | Final hardening, enterprise certification packs, ops dashboard, request IDs / Prometheus metrics |
| **v1.3.7** | Stable release: financial KPI integrity, recon lifecycle, display IDs, dashboard polish |
| **v1.3.6** | Production stabilisation, messaging memory fallback, health diagnostics, UI filter/toolbar polish |
| **v1.3.5** | Premium splash, branded OTP email, notification center refresh |
| **v1.3.4** | Mobile photo capture routes, session invalidation on password reset |
| **v1.3.3** | Service worker fixes, sign-in redesign |
| **v1.3.0** | Offline PWA, sync conflicts, device health, advanced lending |

See `CHANGELOG.md`, `PROJECT_STATUS.md`, and `docs/version-history.md`.

---

## Documentation Index

| Topic | Path |
|-------|------|
| Docs hub | `docs/README.md` |
| Project status | `PROJECT_STATUS.md` |
| Changelog | `CHANGELOG.md` |
| System architecture (SSoT) | `docs/certification/v1.3.8/enterprise-architecture/SYSTEM_ARCHITECTURE.md` |
| Architecture (legacy index) | `docs/architecture/architecture.md` |
| API overview | `docs/api-overview.md` |
| Authentication | `docs/authentication.md` |
| Permission matrix | `docs/permission-matrix.md` |
| Security | `docs/security-guide.md` |
| Offline / PWA | `docs/offline-architecture.md` |
| Sync & conflicts | `docs/synchronization-guide.md` |
| Mobile / field ops | `docs/mobile-guide.md` |
| Advanced lending | `docs/advanced-lending.md` |
| Financial calculations | `docs/financial-calculations.md` |
| Deployment | `docs/deployment-guide.md` |
| Production ops (day-to-day) | `docs/operations/` |
| Production ops pack (v1.3.8) | `docs/certification/v1.3.8/production-operations/` |
| Product acceptance (v1.3.8) | `docs/certification/v1.3.8/product-acceptance/` |
| Go-live / production certification (v1.3.8) | `docs/certification/v1.3.8/go-live/` |

Historical certification evidence is preserved under `docs/archive/`.

---

## Contributing & Support

1. Branch from `main` using the `cursor/<description>-8847` naming convention for agent workflows.
2. Run `npm run type-check`, `npm run lint`, and `npm test` before opening a PR.
3. Keep display IDs and RBAC permissions aligned when adding routes or APIs.
4. Report issues at [github.com/e-mond/WILMS/issues](https://github.com/e-mond/WILMS/issues).

---

## License

Private / organisation use. See repository owner for licensing terms.
