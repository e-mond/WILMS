# WILMS

Women's Interest-Free Loan Management System (WILMS) is a TypeScript monorepo for borrower onboarding, group lending, loan lifecycle management, weekly collections, audit trails, and role-based reporting.

## Current Release

| Version | Focus |
|---------|-------|
| **v1.3.5** | UI/UX & communication — premium splash, email design system, notification center refresh |
| **v1.3.4** | Production stabilization — mobile photo capture public routes, session invalidation on password reset |
| **v1.3.3** | Stability & UX — service worker fixes, sign-in redesign, forgot-password routing |
| **v1.3.0** | Field operations — offline PWA shell, device health, background uploads, sync conflict review |
| **v1.2.3** | Platform stabilization — invitation lifecycle, SMS delivery, UI hardening |
| **v1.0.0** | Production baseline |

See `CHANGELOG.md` and `PROJECT_STATUS.md` for full release history.

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

After deploy, verify mobile capture public routes (must not return 401):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "${WILMS_APP_URL}/api/wilms/photo-capture/sessions/pcs_invalid00000001"
```

## Field Operations (v1.3.0)

Collectors work in low-connectivity environments with:

- **Offline payment queue** — record collections without network; sync on reconnect
- **PWA shell** — installable app with cached navigation (`/collector/dashboard` start URL)
- **Background uploads** — photos and attachments queued in IndexedDB
- **Device health** — battery and storage monitoring in collector settings
- **Sync review** — approvers resolve offline financial operations at `/approver/sync-conflicts`
- **QR / barcode scanning** — borrower and loan lookup in the field
- **Receipt printing** — thermal-friendly text receipts

Grace periods, repayment cadences, fees, penalties, and guarantor scoring domain modules ship in v1.3.0 (see `docs/advanced-lending.md`).

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

### Release & status

- `PROJECT_STATUS.md` — current version and verification status
- `CHANGELOG.md` — release notes
- `docs/version-history.md` — version timeline

### Architecture & operations

- `docs/architecture/architecture.md` — system architecture
- `docs/offline-architecture.md` — offline mode and PWA
- `docs/synchronization-guide.md` — offline sync and conflict resolution
- `docs/device-management.md` — battery, storage, compression
- `docs/mobile-guide.md` — PWA install, camera, scanning, receipts
- `docs/advanced-lending.md` — repayment engine, fees, penalties
- `docs/api-overview.md` — API surface reference
- `docs/deployment-guide.md` — deploy procedures
- `docs/production-guide.md` — production operations
- `docs/security-guide.md` — security controls
- `docs/authentication.md` — auth flows and session management

### v1.3.0 reports

- `V1.3.0_FIELD_OPERATIONS_REPORT.md`
- `OFFLINE_MODE_REPORT.md`
- `MOBILE_PLATFORM_REPORT.md`
- `DEVICE_MANAGEMENT_REPORT.md`
- `ADVANCED_LENDING_REPORT.md`

### Maintenance (v1.0.1)

- `REPOSITORY_CLEANUP_REPORT.md`
- `DOCUMENT_ARCHIVE_REPORT.md`
- `DEPENDENCY_CLEANUP_REPORT.md`
- `TECHNICAL_DEBT_REPORT.md`
- `ARCHIVED_FILES.md`
- `DELETED_FILES.md`

## Historical Evidence

Version 1.0.0 and pre-1.0 certification evidence is preserved in `docs/archive/`. Do not delete archived evidence without replacing it with a traceable historical record.