# @wilms/api — thin adapter

This package is a **process adapter** over `@wilms/domain`.

- Local Node API: `npm run dev:api` (runs `@wilms/domain` listen bootstrap)
- Production (v1.5+): prefer the Next.js app on Vercel (`/api/wilms/*` Route Handlers)
- Database migrations: `npm run db:migrate -w @wilms/domain` (or `-w @wilms/api`)
