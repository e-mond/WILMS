# WILMS

Women's Interest-Free Loan Management System (WILMS) is a TypeScript monorepo for borrower onboarding, group lending, loan lifecycle management, weekly collections, audit trails, and role-based reporting.

Version 1.0.0 is the production release. **v1.3.0** delivers field operations foundations (offline PWA shell, device health, background uploads, sync conflict review, advanced lending domain). **v1.2.3** stabilizes user management, SMS invitations, and production UI reliability.

## Production Services

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://wilms.vercel.app |
| API | Railway | https://wilms-production.up.railway.app |
| Database | Neon PostgreSQL | managed through Railway env |
| Uploads | Cloudinary | backend upload provider in production |

## Repository Structure

```text
wilms/
+-- apps/
¦   +-- frontend/              # Next.js App Router UI and BFF proxy
¦   +-- backend/               # Express API, Drizzle schema, verification harnesses
+-- packages/                  # Shared contracts, RBAC, validation, types, utilities
+-- data/ghana-locations/      # Ghana location seed source files
+-- docs/
¦   +-- architecture/          # Current architecture documentation
¦   +-- engineering/           # Current engineering guides
¦   +-- archive/               # Historical RC/recovery/certification evidence
¦   +-- generated/             # Regenerated verification outputs (created by scripts)
+-- scripts/                   # Root verification, budget, and cleanup scripts
+-- .github/workflows/         # CI and deploy workflows
+-- package.json               # npm workspace entrypoint
```

Historical RC reports previously kept at the repository root and under `docs/page-validation/` are archived under `docs/archive/`.

## Required Tooling

- Node.js 20 or newer
- npm workspaces
- Railway CLI for API deploys
- Vercel CLI for frontend deploys

## First-Time Setup

```bash
npm install
cp .env.example .env
```

Set real credentials in `.env` or deployment secrets. Never commit `.env` files.

## Core Commands

```bash
npm run type-check
npm run lint
npm run build
npm test
npm run db:migrate -w @wilms/api
npm run smoke:production
npm run smoke:rbac
```

Production smoke requires `WILMS_APP_URL` and `WILMS_API_URL` environment variables.

## Notifications (v1.1.2+)

Outbound email from Railway uses a Vercel Gmail relay when `WILMS_VERCEL_MAIL_URL` and `WILMS_INTERNAL_MAIL_SECRET` are set on the API. Gmail credentials (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) must be on Vercel. Delivery attempts are logged to `message_deliveries` and queryable via `GET /settings/delivery-logs` or the Communication Center.

## Communication Center (v1.1.3)

Super admins can access `/communication-center` to compose broadcasts, manage templates, review delivery analytics, and monitor failed messages across Email, SMS, and In-App channels.

Additional verification:

```bash
npm run verify:api-integrity
npm run verify:api-coverage
npm run verify:mock-guard
npm run verify:deploy-sync
npm run verify:empty-db
```

## Application Architecture

Production request flow:

```text
Browser UI -> Next.js /api/wilms BFF -> Railway API -> Drizzle repositories -> Neon PostgreSQL
```

The frontend service layer switches between API and mock implementations based on environment. Production must use live API mode (`NEXT_PUBLIC_USE_MOCK=false`, real API URL configured).

## Data and IDs

Business-facing screens display readable IDs such as borrower, collector, group, loan, pool, payment, and user display IDs. Raw UUIDs remain internal where required.

Ghana location data is seeded from `data/ghana-locations/` via:

```bash
npm run seed:ghana-locations
```

## Deployment

API deploy from repository root:

```bash
railway up --detach
```

Frontend deploy from repository root:

```bash
vercel deploy --prod --yes
```

See `docs/deployment-guide.md` and `docs/production-guide.md` for operational details.

## Documentation

Current authoritative docs:

- `PROJECT_STATUS.md`
- `CHANGELOG.md`
- `docs/architecture/architecture.md`
- `docs/deployment-guide.md`
- `docs/security-guide.md`
- `REPOSITORY_STRUCTURE.md`
- `MAINTENANCE_SUMMARY.md`

Maintenance reports for v1.0.1:

- `REPOSITORY_CLEANUP_REPORT.md`
- `DOCUMENT_ARCHIVE_REPORT.md`
- `DEPENDENCY_CLEANUP_REPORT.md`
- `TECHNICAL_DEBT_REPORT.md`
- `ARCHIVED_FILES.md`
- `DELETED_FILES.md`

## Historical Evidence

Version 1.0.0 and pre-1.0 certification evidence is preserved in `docs/archive/`. Do not delete archived evidence without replacing it with a traceable historical record.