# Performance Report — v1.5.0

## Frontend

- Existing bundle/perf budget scripts retained (`bundle:budget-check`, `perf:budget-check`)
- Route Handlers use Node runtime (not Edge) to support transactions, bcrypt, and Neon serverless pool
- Client `apiClient` paths unchanged (no extra network hop when in-process)

## Backend / data

- SQL aggregations preserved (no in-memory financial rollups)
- Neon serverless `Pool` via `@neondatabase/serverless` + Drizzle
- Production must use **pooled** `DATABASE_URL` to avoid connection exhaustion under concurrency
- BullMQ workers disabled on serverless; mail/SMS use in-process enqueue fallback within the invocation

## Infrastructure

- Vercel function `maxDuration` 60s (API) / 300s (cron)
- Redis-backed rate limits required in serverless production
- Warm-start: rely on Vercel Fluid/provisioned concurrency where available; document cold-start risk for first request after idle
