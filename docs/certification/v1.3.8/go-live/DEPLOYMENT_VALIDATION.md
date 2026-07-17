# Deployment Validation — WILMS v1.3.8

**Date:** 17 July 2026  
**Platforms:** Railway (API), Vercel (frontend)

---

## Summary

| Component | Target | Version | HTTP | Result |
|-----------|--------|---------|------|--------|
| API | `wilms-production.up.railway.app` | `1.3.8` | 200 `/health` | **PASS** |
| Frontend | `wilms.vercel.app` | `1.3.8` (in page) | 200 `/login` | **PASS** |
| BFF CSRF | `wilms.vercel.app/api/auth/csrf` | — | 200 | **PASS** |
| CORS origin | API → frontend | `wilms.vercel.app` | Header present | **PASS** |

---

## API deployment (Railway)

### Health evidence

**URL:** `https://wilms-production.up.railway.app/health`  
**Evidence:** `evidence/prod-health-20260717T170225Z.json`

| Field | Value |
|-------|-------|
| `version` | `1.3.8` |
| `gitCommit` | `43c1a87aa223c32daab683b983b4b33ba86d301e` |
| `environment` | `production` |
| `runtime.nodeVersion` | `v20.20.2` |
| `runtime.deployedAt` | `2026-07-17T16:50:39.358Z` |
| `runtime.buildId` | `3e65e967-dc85-48b7-91ce-d30956b69969` |
| `uptimeSeconds` | 706 (at probe time) |

**Commit note:** `43c1a87…` is the Phase 20 merge commit. Phase 21 was documentation-only; no additional application code deploy required beyond Phase 20 baseline for v1.3.8.

### Response headers

**Evidence:** `evidence/api-response-headers.txt`

| Header | Value |
|--------|-------|
| `server` | `railway-hikari` |
| `x-railway-edge` | `jfk1` |
| `x-railway-request-id` | `rfaGMa1kQOG2Rap4YqVb7A` |
| `access-control-allow-origin` | `https://wilms.vercel.app` |
| `access-control-allow-credentials` | `true` |

---

## Frontend deployment (Vercel)

| Probe | Result |
|-------|--------|
| `GET https://wilms.vercel.app/login` | HTTP 200 |
| Version string in HTML | Contains `1.3.8` |
| `GET https://wilms.vercel.app/api/auth/csrf` | HTTP 200, `{"ok":true}` |

**Headers:** `evidence/frontend-response-headers.txt`

| Header | Value |
|--------|-------|
| `server` | `Vercel` |
| `x-vercel-id` | `iad1::iad1::b9qfh-1784307748268-ccd5134a341b` |
| `x-vercel-cache` | `MISS` |
| `strict-transport-security` | `max-age=63072000; includeSubDomains; preload` |

---

## Local deploy-readiness gates

From agent session (`evidence/local-gates.txt`):

| Gate | Result |
|------|--------|
| `npm run verify:version` | **PASS** — all packages `1.3.8` |
| `npm run type-check` | **PASS** |
| `npm run bundle:budget-check` | **PASS** |
| `verify:mock-guard` + API integrity | **PASS** |

---

## CI / workflow evidence (repo)

| Item | Status | Reference |
|------|--------|-----------|
| Deploy workflow (`workflow_dispatch`) | Documented | `.github/workflows/deploy-production.yml` |
| Post-deploy health curl in workflow | Documented | `deploy-production.yml` verify-production job |
| `verify:deploy-sync` in workflow | Documented | `scripts/verify-deploy-sync.mjs` |

**This-session CI run URL:** **Pending** — not captured in agent environment.

---

## Environment configuration

### Confirmed via `/health` (production)

| Variable / setting | Evidence |
|--------------------|----------|
| Database connected | `database.connected: true` |
| `UPLOAD_PROVIDER=cloudinary` | `uploads.activeProvider: cloudinary`, `valid: true` |
| Gmail mail relay | `integrations.mail.provider: gmail`, `configured: true` |
| SMS (smsnotifygh) | `integrations.sms.configured: true` |
| Session provider | `session.provider: hmac-signed-token` |

### Not verified this session (Vercel/Railway console export)

| Item | Status |
|------|--------|
| `WILMS_API_UPSTREAM` → Railway production URL | **Pending** — inferred from working BFF/CSRF |
| `NEXT_PUBLIC_USE_MOCK=false` | **Pending** — inferred from live API integration |
| `NEXT_PUBLIC_API_BASE_URL=/api/wilms` | **Pending** |
| Railway secret audit | **Pending** |
| Vercel env export screenshot | **Pending** |

---

## Worker / scheduler posture (deployed)

From health payload:

| Component | Value | Notes |
|-----------|-------|-------|
| `workers.redis` | `not_used` | Accepted for v1.3.8 |
| `workers.queue` | `in_process` | Documented residual risk |
| `workers.scheduler` | `http_triggered` | Cron via HTTP trigger |

---

## Post-deploy smoke (authenticated)

| Item | Status |
|------|--------|
| `smoke:production` with `WILMS_SMOKE_*` | **Pending** |
| `smoke:rbac` all roles | **Pending** |
| E2E Playwright on production URL | **Pending** |

---

## Verdict

| Area | Result |
|------|--------|
| API deployed and healthy | **PASS** |
| Frontend deployed with correct version | **PASS** |
| CSRF / BFF path operational | **PASS** |
| CORS aligned to production frontend | **PASS** |
| Env var audit export | **Pending** |
| Authenticated deploy smoke | **Pending** |

Deployment validation **supports software go-live**. Operator checklist items remain for env audit and authenticated smoke.
