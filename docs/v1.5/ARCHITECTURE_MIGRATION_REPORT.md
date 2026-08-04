# Architecture Migration Report — v1.5.0

## Goal

Move from split frontend (Vercel) + Express API (Railway) to a modular monolith on Next.js Route Handlers with shared domain package `@wilms/domain`.

## Package layout

```
wilms/
├── apps/frontend/          # Next.js UI + /api/wilms + /api/cron
├── apps/backend/           # Thin adapter → @wilms/domain listen (optional)
├── packages/domain/        # DB, services, repositories, Express HTTP app
├── packages/shared-*       # Cross-cutting contracts
└── vercel.json             # Build + Cron
```

## Transport

- Browser continues to call `/api/wilms/*` via `apiClient`.
- Catch-all Route Handler runs `handleWilmsFetchRequest` against the existing Express router tree (path mapping unchanged: auth → `/auth/*`, health → `/health`, else `/api/v1/*`).
- CSRF remains enforced on mutating BFF/Route Handler requests.
- Session cookie is forwarded as `Authorization: Bearer` as before.

## Domain extraction

Source formerly under `apps/backend/src` now lives in `packages/domain/src`. Migration history under `packages/domain/src/db/migrations` is preserved (not rewritten).

## Runtime modes

| Mode | How |
|---|---|
| Vercel production | `WILMS_RUNTIME=serverless` (auto on Vercel); no BullMQ workers |
| Local full-stack | `npm run dev` — API in-process in Next |
| Local dual-run | `WILMS_API_MODE=proxy` + `npm run dev:api` |
| Rollback Node | `@wilms/api` / `@wilms/domain` listen on `:4000` |

## Express status

The standalone Railway Express **process** is no longer required. The `express` package remains the internal HTTP router inside `@wilms/domain`, invoked exclusively through Next.js Route Handlers in the target deployment. Per-route native handlers can be peeled incrementally without changing domain services.
