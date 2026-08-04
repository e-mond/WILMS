# Database Report — v1.5.0

## Engine

- Neon PostgreSQL
- Drizzle ORM
- Driver: `@neondatabase/serverless` Pool + `drizzle-orm/neon-serverless`

## Migrations

- Location: `packages/domain/src/db/migrations`
- Commands: `npm run db:migrate -w @wilms/domain` (also via `-w @wilms/api` shim)
- History preserved; no abandoned migrations removed in this release

## Connection guidance

| Environment | Connection |
|---|---|
| Vercel Route Handlers | Neon **pooled** connection string |
| Local migrate / drizzle-kit | Direct or pooled as documented by Neon |
| Concurrent load | Verify pooler limits before certifying cutover |

## In-memory fallback

When `DATABASE_URL` is unset, domain falls back to in-memory store for local demo only — never for production.
