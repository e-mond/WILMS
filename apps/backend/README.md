# `@wilms/api` — thin adapter

Process adapter over `@wilms/domain` for optional dual-run local development.

- Preferred local mode: Next.js in-process API via `apps/frontend` (`NEXT_PUBLIC_API_BASE_URL=/api/wilms`)
- Dual-run Node API: `npm run dev:api` (listens on `:4000`) with `WILMS_API_MODE=proxy`
- Production (v1.5+): Next.js on Vercel serves `/api/wilms/*` in-process
- Migrations: `npm run db:migrate -w @wilms/domain` (also available via this workspace shim)

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) and the root [README](../../README.md).
