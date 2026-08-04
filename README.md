# WILMS

**Women's Interest-Free Loan Management System**

WILMS is a production TypeScript monorepo that supports interest-free group lending operations: borrower registration, approval, disbursement, weekly collections, reconciliation, expenses, notifications, audit, and role-based reporting.

| | |
|---|---|
| **Current version** | `1.5.0` |
| **Maturity** | Production platform; v1.5 consolidates UI and API onto a single Vercel deployment |
| **Primary deploy** | [wilms.vercel.app](https://wilms.vercel.app) |
| **Runtime** | Node.js 22+ |
| **Database** | Neon PostgreSQL (Drizzle ORM) |

---

## Architecture summary

```text
Browser (staff portals)
        │
        ▼
Next.js 14 App Router  (@wilms/frontend on Vercel)
  │  UI (RSC + Client Components)
  │  /api/auth/*          session cookies
  │  /api/wilms/*         domain HTTP via Route Handlers
  │  /api/cron/*          Vercel Cron (notifications)
        │
        ▼
@wilms/domain
  services · repositories · RBAC · financial engine
  Express router hosted in-process (not a separate Railway process)
        │
        ▼
Neon PostgreSQL  (+ Redis for rate limiting in production)
```

Optional dual-run: set `WILMS_API_MODE=proxy` and `WILMS_API_UPSTREAM` to call a separate Node process (`npm run dev:api`) during migration or rollback. Production target is **in-process** Route Handlers only.

Authentication is **custom HMAC session cookies** (`wilms_session`), not Auth.js/NextAuth.

---

## Technology stack

| Layer | Technology |
|---|---|
| UI | Next.js 14, React 18, TanStack Query, Tailwind, shadcn/ui |
| API | Next.js Route Handlers + `@wilms/domain` |
| Data | Drizzle ORM, Neon PostgreSQL |
| Auth | HMAC-signed `wilms_session` cookie / Bearer |
| Jobs | Vercel Cron → `/api/cron/notifications` |
| Rate limits | Redis (`REDIS_URL` / `WILMS_REDIS_URL`) in serverless production |
| Packages | npm workspaces (`apps/*`, `packages/*`) |

---

## Repository structure

```text
wilms/
├── apps/frontend/     @wilms/frontend — UI + Route Handlers + Cron
├── apps/backend/      @wilms/api — thin Node listen adapter (optional dual-run)
├── packages/domain/   @wilms/domain — services, DB, HTTP app, migrations
├── packages/shared-*  contracts, RBAC, types, validation, utils
├── docs/              current documentation hub + archives
├── vercel.json        Vercel build + Cron
├── CHANGELOG.md
└── VERSION.md
```

---

## Quick start

### Prerequisites

- Node.js **22+** (see `.nvmrc`)
- npm (workspaces)
- Optional: Neon `DATABASE_URL` for persistent data (otherwise in-memory domain mode)

### Install

```bash
git clone https://github.com/e-mond/WILMS.git
cd WILMS
npm ci
```

### Local full-stack (recommended)

Create `apps/frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=/api/wilms
NEXT_PUBLIC_USE_MOCK=false
DATABASE_URL=           # optional; omit for in-memory
WILMS_SESSION_SECRET=dev-only-change-me
```

```bash
npm run dev
```

Open `http://127.0.0.1:3000`. API calls stay same-origin on `/api/wilms/*`.

### Optional dual-run API process

```bash
# Terminal A
npm run dev:api

# Terminal B — apps/frontend/.env.local
# WILMS_API_MODE=proxy
# WILMS_API_UPSTREAM=http://127.0.0.1:4000
npm run dev
```

### Demo accounts (seed / in-memory)

| Email | Password | Role |
|---|---|---|
| `admin@wilms.demo` | `DemoAdmin1!` | Super Admin |
| `collector@wilms.demo` | `DemoCollect1!` | Collector |
| `officer@wilms.demo` | `DemoOfficer1!` | Registration Officer |
| `approver@wilms.demo` | `DemoApprove1!` | Approver |
| `auditor@wilms.demo` | `DemoAudit1!` | Auditor |

Defined in `packages/domain/src/seed/demo-users.ts`.

---

## Documentation map

| Topic | Location |
|---|---|
| Docs hub | [`docs/README.md`](docs/README.md) |
| Architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Environment variables | [`docs/environment.md`](docs/environment.md) |
| Authentication | [`docs/authentication.md`](docs/authentication.md) |
| Permissions / RBAC | [`docs/PERMISSIONS_AND_ROLES.md`](docs/PERMISSIONS_AND_ROLES.md) |
| Financial model | [`docs/FINANCIAL_MODEL.md`](docs/FINANCIAL_MODEL.md) |
| Deployment | [`docs/deployment-guide.md`](docs/deployment-guide.md) |
| Operations | [`docs/operations.md`](docs/operations.md) |
| Troubleshooting | [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) |
| Contributing | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| v1.5 consolidation | [`docs/v1.5/`](docs/v1.5/) |
| Historical archives | [`docs/archive/README.md`](docs/archive/README.md) |

---

## Testing

```bash
npm run type-check
npm run lint
npm run test                 # frontend
npm run test -w @wilms/domain
npm run build
npm run verify:version
```

Financial / RBAC / notification verification scripts live under `@wilms/domain` (`npm run verify:financial -w @wilms/domain`, `smoke:rbac`, `smoke:notifications`, etc.).

---

## Deployment overview

- **Platform:** Vercel (UI + API + Cron)
- **Database:** Neon (use the **pooled** connection string on Vercel)
- **Secrets:** configure Preview and Production separately (see [`docs/environment.md`](docs/environment.md))
- **Migrations:** `npm run db:migrate -w @wilms/domain` against Neon before/after promote
- **Scheduler:** Vercel Cron `0 6 * * *` → `/api/cron/notifications`
- **Rollback:** keep prior Vercel deployment / `main` history; optional Node dual-run — see [`docs/v1.5/FINAL_RELEASE_READINESS.md`](docs/v1.5/FINAL_RELEASE_READINESS.md)

---

## Security considerations

- Never commit `.env` / `.env.local`
- Production requires non-default `WILMS_SESSION_SECRET`
- Serverless production requires Redis for shared rate limiting
- CSRF enforced on mutating `/api/wilms/*` (except designated public capture paths)
- Clients never receive stack traces, SQL, or ORM internals

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Branch from `main`, validate, open a PR. Do not merge platform cutovers without the review checkpoints described in the v1.5 readiness doc.

---

## Versioning & changelog

- [`VERSION.md`](VERSION.md) — current release metadata  
- [`CHANGELOG.md`](CHANGELOG.md) — release history  

---

## Ownership & license

This is a paid client project for the WILMS product organization. Package metadata is private (`"private": true`). Do not add personal contributor branding to project artifacts unless the project owner requests it.

License: proprietary / private unless a `LICENSE` file states otherwise. No open-source license file was verified in this repository at documentation time.
