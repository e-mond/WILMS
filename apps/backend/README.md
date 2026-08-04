# `@wilms/api` — thin adapter

Process adapter over `@wilms/domain`.

- Local Node API: `npm run dev:api` (domain listen bootstrap)
- Production (v1.5+): Next.js on Vercel serves `/api/wilms/*` in-process
- Migrations: `npm run db:migrate -w @wilms/domain` (also available via this workspace shim)

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
