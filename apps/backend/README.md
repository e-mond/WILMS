# WILMS API (@wilms/api)

Node/Express backend in the WILMS monorepo (`apps/backend`).

## Run (from repository root)

```bash
npm run dev:api
```

Default: `http://127.0.0.1:4000`

Without `DATABASE_URL`, the API uses the in-memory store (`src/db/store.ts`). With `DATABASE_URL` set to a Neon PostgreSQL connection string, repositories persist to PostgreSQL via Drizzle.

## Database (Neon + Drizzle)

```bash
# From repository root
cd apps/backend
export DATABASE_URL=postgresql://...

npm run db:migrate   # apply migrations
npm run db:seed      # seed demo users + RBAC catalog
```

Schema: `src/db/schema/`  
Migrations: `src/db/migrations/`  
Repositories: `src/repositories/`

## Frontend integration

Set in `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=/api/wilms
WILMS_API_UPSTREAM=http://127.0.0.1:4000
```

Next.js BFF proxy: `apps/frontend/src/app/api/wilms/[...path]/route.ts`

## Shared packages

- `@wilms/shared-rbac` — permissions and roles
- `@wilms/shared-contracts` — canonical enums
- `@wilms/shared-types` — API envelope types
- `@wilms/shared-validation` — Zod schemas (e.g. login API)

See `docs/archive/page-validation/P14.2-frontend-contract-verification.md` for schema traceability.
