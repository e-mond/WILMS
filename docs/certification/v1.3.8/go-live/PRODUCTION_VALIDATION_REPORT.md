# Production Validation Report — WILMS v1.3.8

**Date:** 17 July 2026  
**Method:** Unauthenticated public probes (curl)  
**Targets:** Railway API (`wilms-production.up.railway.app`), Vercel frontend (`wilms.vercel.app`)

---

## Summary

| Area | Result |
|------|--------|
| API health | **PASS** |
| API version alignment | **PASS** (`1.3.8`) |
| Database connectivity | **PASS** |
| Schema integrity | **PASS** |
| Migration watermark | **PASS** (`0027`) |
| Uploads (Cloudinary) | **PASS** |
| Mail / SMS integrations | **PASS** |
| Frontend version in UI | **PASS** |
| CSRF endpoint | **PASS** |
| Anonymous metrics blocked | **PASS** (401) |
| Authenticated workflows | **Pending** (no smoke credentials) |

---

## API health (`GET /health`)

**URL:** `https://wilms-production.up.railway.app/health`  
**Result:** HTTP 200  
**Evidence:** `evidence/prod-health-20260717T170225Z.json`

### Response body (key fields)

```json
{
  "status": "ok",
  "degradedReasons": [],
  "version": "1.3.8",
  "gitCommit": "43c1a87aa223c32daab683b983b4b33ba86d301e",
  "database": { "configured": true, "connected": true, "status": "connected" },
  "migrations": {
    "expected": 28,
    "applied": 27,
    "status": "ok",
    "countGap": true,
    "latestAppliedAt": "2026-07-17T14:00:00.000Z",
    "latestJournalWhen": 1784296800000
  },
  "schema": { "status": "ok", "missingTables": [] },
  "uploads": { "activeProvider": "cloudinary", "valid": true },
  "integrations": {
    "mail": { "provider": "gmail", "configured": true },
    "sms": { "provider": "smsnotifygh", "configured": true }
  },
  "workers": {
    "redis": "not_used",
    "queue": "in_process",
    "scheduler": "http_triggered"
  }
}
```

### Interpretation

- **Service healthy** — `status: ok`, empty `degradedReasons`.
- **Database live** — connected in production.
- **Schema complete** — `missingTables: []`.
- **Migration watermark current** — `latestJournalWhen: 1784296800000` matches journal entry `0027_hot_query_indexes`. Row count gap (27 vs 28) is historical; see [MIGRATION_VERIFICATION.md](./MIGRATION_VERIFICATION.md).
- **Deploy SHA** — `43c1a87…` reflects Phase 20 merge; Phase 21 was documentation-only.

---

## Frontend validation

| Probe | URL | HTTP | Body / header check | Result |
|-------|-----|------|---------------------|--------|
| Login page | `https://wilms.vercel.app/login` | 200 | Body contains `1.3.8` | **PASS** |
| CSRF | `https://wilms.vercel.app/api/auth/csrf` | 200 | `{"ok":true}` | **PASS** |

**Frontend headers:** `evidence/frontend-response-headers.txt`

| Header | Value | Notes |
|--------|-------|-------|
| `strict-transport-security` | `max-age=63072000; includeSubDomains; preload` | HSTS with preload |
| `server` | `Vercel` | |
| `x-matched-path` | `/login` | Route resolved |

---

## Auth enforcement

| Probe | URL | HTTP | Expected | Result |
|-------|-----|------|----------|--------|
| Anonymous metrics | `GET /ops/metrics` | 401 | Auth required | **PASS** |

Evidence: `evidence/latency-samples.csv` (row: `GET /ops/metrics (anon),401,0.102655`)

---

## API response headers (security-relevant)

**Evidence:** `evidence/api-response-headers.txt`

| Header | Present | Value (summary) |
|--------|---------|---------------|
| `strict-transport-security` | ✓ | `max-age=31536000; includeSubDomains` |
| `content-security-policy` | ✓ | Restrictive default-src, frame-ancestors |
| `x-content-type-options` | ✓ | `nosniff` |
| `referrer-policy` | ✓ | `no-referrer` |
| `x-frame-options` | ✓ | `SAMEORIGIN` |
| `access-control-allow-origin` | ✓ | `https://wilms.vercel.app` |
| `x-request-id` | ✓ | `2b563520-3bb1-45af-9b4b-dbbc993add17` |

Detail: [SECURITY_SIGNOFF.md](./SECURITY_SIGNOFF.md)

---

## Latency (public probes)

**Evidence:** `evidence/latency-samples.csv`

| Endpoint | Samples | Range (time_total) |
|----------|---------|-------------------|
| `GET /health` | 5 | 0.314–0.345 s |
| `GET /login` | 3 | 0.110–0.164 s |
| `GET /api/auth/csrf` | 1 | 0.033 s |
| `GET /ops/metrics` (anon) | 1 | 0.103 s |

Detail: [PERFORMANCE_VALIDATION.md](./PERFORMANCE_VALIDATION.md)

---

## Pending validation (no credentials)

| Item | Reason | Required evidence |
|------|--------|-------------------|
| Login → session → logout | `WILMS_SMOKE_*` unset | Smoke script output with prod credentials |
| Money-chain: fee → disburse → collect → recon | `WILMS_SMOKE_*` unset | `smoke:production` log |
| RBAC per role | No role credentials | `smoke:rbac` output |
| `/ops/metrics` with token | `WILMS_METRICS_TOKEN` unset | Authenticated curl + Prometheus scrape config |
| Password reset flow | Not probed | Manual test log |
| Registration 7-step workflow | Not probed | Manual or E2E log |

---

## Integration matrix (from health)

| Integration | Provider | Configured | Valid |
|-------------|----------|------------|-------|
| Uploads | Cloudinary | ✓ | ✓ |
| Mail | Gmail | ✓ | — |
| SMS | smsnotifygh | ✓ | — |
| Session | HMAC-signed-token | — | — |
| Workers / queue | in_process | — | Accepted residual (v1.4) |

---

## Verdict

**Public production validation: PASS** for health, version, schema, integrations, frontend alignment, CSRF, and anonymous auth enforcement.

**Authenticated production validation: Pending** — complete [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md) §1–3.
