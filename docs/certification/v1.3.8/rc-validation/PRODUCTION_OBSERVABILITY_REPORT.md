# Production Observability Report

**Date:** 17 July 2026

## Current capability

| Signal | Present? | Evidence |
|---|---|---|
| Health endpoint | Yes | `GET /health` — DB, migrations watermark, uploads, schema, integrations, workers |
| Structured API logs | Yes | JSON console logger (`infrastructure/logging/logger.ts`) |
| Frontend prod logging | No | NoOp logger in production |
| Correlation / request IDs | **No** | Not in HTTP middleware |
| OpenTelemetry / APM | **No** | Roadmap v1.4 |
| Metrics (RED/USE) | **No** | — |
| Slow query logging | **No** | Rely on Neon insights |
| Error aggregation (Sentry etc.) | **No** | Types exist; no vendor |
| Alerting | Partial | Ops docs; no in-app alert bus |
| Business / financial dashboards | Yes | App dashboards + reports |
| Operational dashboards | External | Railway/Vercel/Neon consoles |

## Recommendations (v1.4 — not RC Critical)

1. Propagate `x-request-id` end-to-end (BFF → API → logs)  
2. OpenTelemetry traces on money paths  
3. Alerts: health degraded, payment 5xx rate, queue depth (once queued), migration watermark  
4. Enable sampled slow-query logging in Neon  
5. Optional Sentry for frontend + API  

## RC stance

Observability is **adequate for a small/medium ops deploy** with platform-native monitoring. It is **insufficient for Fortune-500 SRE standards**.
