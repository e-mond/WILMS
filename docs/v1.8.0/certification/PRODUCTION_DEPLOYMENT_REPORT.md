# WILMS v1.8.0 — Production Deployment Report

**Generated (UTC):** 2026-08-09T19:22:00Z  
**Host:** https://wilms.vercel.app  
**Certification branch:** `fix/v1.8.0-production-certification`

## Verdict

**PASS (deployment identity + health)** with **notes** on CORS default and authenticated smoke **BLOCKED**.

## Deployment identity

| Field | Evidence |
|-------|----------|
| Production GitHub deployment SHA | `73e5b65d6a509b5c64f08f18e7266b59c72c0860` (deployment id `5821873959`, `2026-08-09T19:01:38Z`) |
| `origin/main` SHA | Same |
| Live `/api/wilms/health` `gitCommit` | Same (`evidence/health.json`) |
| Health `version` | `1.8.0` |
| Health `environment` | `production` |
| Health `status` | `ok` (`degradedReasons: []`) |
| Database | configured + connected |
| Migrations | status `ok` (39 applied / 40 expected watermark count-gap) |
| Uploads | Cloudinary valid |
| Mail / SMS | configured (`gmail`, `smsnotifygh`) |
| Node | `v22.23.1` |

## HTTP / security headers (login HTML)

From `evidence/login-headers.txt` (`GET /login` → 200):

- CSP includes `font-src 'self' data:` (no googleapis)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`
- Self-hosted font preload `Link: …woff2`

## HTTP / security headers (API health)

From `evidence/health-headers.txt`:

- `Cache-Control: no-store, must-revalidate`
- HSTS present (`max-age=31536000; includeSubDomains`)
- `X-Request-Id` observed on related API calls (e.g. vapid probe `3b986b10-59a9-4b16-b2b9-295582da360f`)
- **Note:** responses included `Access-Control-Allow-Origin: http://127.0.0.1:3000` — matches domain default `WILMS_CORS_ORIGIN ?? 'http://127.0.0.1:3000'` (`packages/domain/src/config/env.ts`). Browser same-origin UI uses Next Route Handlers; cross-origin CORS still warrants operator confirmation that Production sets `WILMS_CORS_ORIGIN` appropriately for any dual-run clients.

## Authenticated production smoke

**BLOCKED**

Command: `WILMS_APP_URL=https://wilms.vercel.app WILMS_API_URL=https://wilms.vercel.app/api/wilms npm run smoke:production`

Failure (`evidence/smoke-production.log`): `WILMS_SMOKE_EMAIL and WILMS_SMOKE_PASSWORD are required … (demo accounts are disabled on live)`.

**Required to close:** operator-provided non-demo production smoke credentials in env (not committed).

## VAPID public key probe (unauthenticated)

`GET /api/wilms/notifications/push/vapid-public-key` → **401** (`evidence/vapid-body.json`). Route sits behind `notificationsRouter.use(requireAuth)`. Cannot confirm public key value without a session. Health marks push as `optional`.

## Evidence files

- `evidence/health.json`, `health-headers.txt`, `login-headers.txt`, `health-same-origin.json`
- `evidence/vapid-headers.txt`, `vapid-body.json`
- `evidence/smoke-production.log`
