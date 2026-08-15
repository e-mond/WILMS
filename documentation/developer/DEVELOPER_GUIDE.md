# WILMS Developer Guide

**Version:** 1.7.3  
**Audience:** Engineers contributing to WILMS  
**Classification:** Confidential

---

## 1. Prerequisites

- Node.js 22.x
- npm (workspaces)
- Neon PostgreSQL account (or local DATABASE_URL)
- Git

Group capacity and settings enforcement live in `packages/domain/src/modules/settings/group-limits.ts`. Reverse geocode: `GET /locations/reverse-geocode`. Records: `GET /records/search`, `GET /records/borrowers/:id`.

---

## 2. Repository setup

```bash
git clone <repository-url>
cd WILMS
npm ci
```

Create `apps/frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=/api/wilms
NEXT_PUBLIC_USE_MOCK=false
DATABASE_URL=<neon-connection-string>
WILMS_SESSION_SECRET=dev-only-change-me
```

Start development:

```bash
npm run dev
```

Application available at http://localhost:3000

---

## 3. Monorepo structure

| Package | Purpose |
|---------|---------|
| `@wilms/frontend` | Next.js UI + Route Handlers |
| `@wilms/domain` | Business logic, DB, HTTP app |
| `@wilms/api` | Thin adapter for dual-run |
| `@wilms/shared-rbac` | Roles and permissions |
| `@wilms/shared-validation` | Zod schemas |
| `@wilms/shared-types` | Shared TypeScript types |

---

## 4. Development modes

### In-process (default)

Domain API runs inside Next.js Route Handlers. No separate server needed.

### Dual-run (optional)

```bash
WILMS_API_MODE=proxy
WILMS_API_UPSTREAM=http://127.0.0.1:4000
npm run dev:api   # Terminal 1 — domain on :4000
npm run dev       # Terminal 2 — frontend on :3000
```

---

## 4a. Location master

```bash
npm run db:apply:location-master -w @wilms/domain
npm run db:apply:ghana-hierarchy -w @wilms/domain
npm run seed:ghana-hierarchy -w @wilms/domain
npm run db:backfill:locations -w @wilms/domain
```

Safe transactional reset (keeps users and RBAC):

```bash
WILMS_CONFIRM_DB_RESET=YES npm run db:reset:keep-users -w @wilms/domain
```

See `documentation/location/`.

---

## 5. Adding a domain module

1. Create module directory: `packages/domain/src/modules/my-module/`
2. Add `routes.ts` with Express router
3. Add `service.ts` with business logic
4. Register router in `packages/domain/src/http/app.ts`
5. Add frontend service wrapper in `apps/frontend/src/services/`
6. Add tests in `packages/domain/src/tests/`

### Route pattern

```typescript
export const myRouter = Router();
myRouter.use(requireAuth);
myRouter.get('/my-resource', requirePermission(PERMISSION.VIEW_REPORTS),
  asyncHandler(async (req, res) => {
    sendData(res, await myService.list());
  }),
);
```

---

## 6. Authentication in development

Demo users in `packages/domain/src/seed/demo-users.ts`:

| Email | Password | Role |
|-------|----------|------|
| admin@wilms.demo | DemoAdmin1! | Super Admin |

---

## 7. Database

### Migrations

```bash
npm run db:generate -w @wilms/domain  # Generate from schema changes
npm run db:migrate -w @wilms/domain   # Apply migrations
npm run verify:migrations -w @wilms/api
```

### Schema

Drizzle schema in `packages/domain/src/db/schema/`. Money columns as integer pesewas.

---

## 8. Testing

```bash
npm run test                    # Frontend unit tests (sharded)
npm run test -w @wilms/domain   # Domain unit tests
npm run test:e2e                # Playwright E2E
npm run smoke:rbac              # RBAC smoke
npm run verify:api-integrity    # Route registration
```

---

## 9. Linting and type checking

```bash
npm run lint
npm run type-check
npm run verify:version
```

---

## 10. Frontend conventions

- App Router pages in `apps/frontend/src/app/`
- Feature modules in `apps/frontend/src/features/`
- Shared UI in `apps/frontend/src/components/ui/`
- API client in `apps/frontend/src/lib/apiClient.ts`
- Role protection via `middleware.ts` and `RoleGuard`

---

## 11. Financial code rules

**Do not modify without explicit approval:**
- Pesewas integer money handling
- Pool ledger formulas
- Payment immutability rules
- Admin fee enforcement
- Reconciliation logic

See `docs/FINANCIAL_MODEL.md`.

---

## 12. Documentation

Official library: `documentation/`. Generate PDF/DOCX:

```bash
npm run docs:generate
```

Architecture hub: `docs/`. Update `docs/architecture/progress-tracker.md` after meaningful changes.

Market-readiness notes (v1.8.0):

- Guarantor eligibility: `packages/domain/src/modules/borrowers/guarantor-eligibility.ts`
- Display IDs: `packages/shared-utils/src/display-ids.ts`
- Borrower updates: `packages/domain/src/modules/borrower-updates/`
- Migration: `0044_v180_borrower_update_requests.sql`

---

## 13. Deployment

Production deploys via Vercel on merge. Environment variables configured in Vercel dashboard. See `documentation/operations/OPERATIONS_MANUAL.md`.

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
