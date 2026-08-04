# WILMS Domain (`@wilms/domain`)

Shared domain and HTTP application layer for WILMS.

## Responsibilities

- Drizzle schema and SQL migrations (`src/db/migrations`)
- Domain services and repositories (loans, payments, reconciliation, notifications, …)
- Express HTTP app invoked in-process by Next.js Route Handlers
- Optional long-lived listen mode for local dual-run / rollback (`npm run dev` in this package)

## Commands

```bash
npm run dev -w @wilms/domain          # listen on :4000
npm run db:migrate -w @wilms/domain
npm run test -w @wilms/domain
npm run type-check -w @wilms/domain
```

## Consumption

- Next.js: `import { handleWilmsFetchRequest, … } from '@wilms/domain'`
- Thin adapter: `@wilms/api` re-exports the listen entry

See root [README](../../README.md) and [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
