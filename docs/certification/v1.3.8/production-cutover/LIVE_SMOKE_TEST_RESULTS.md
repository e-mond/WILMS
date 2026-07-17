# Live Smoke Test Results — WILMS v1.3.8 Production Cutover

**Date:** 17 July 2026  
**Phase:** 23  
**Evidence session:** `20260717T193511Z`  
**Target:** Production (`wilms.vercel.app` / `wilms-production.up.railway.app`)

---

## Summary

| Test suite | Status | Reason |
|------------|--------|--------|
| Public probes (health, login, CSRF, anon metrics) | **Complete** | No credentials required |
| `npm run smoke:production` | **Pending** (blocked) | `WILMS_SMOKE_*` **UNSET** |
| `npm run smoke:rbac` | **Pending** | Per-role credentials **UNSET** |
| Manual login / logout | **Pending** | No operator browser session captured |
| Demo account rejection on prod | **Pending** | No smoke execution |
| Password reset enumeration | **Pending** | No smoke execution |

**Overall smoke posture:** **⚠ READY WITH CONDITIONS** — public surface verified; authenticated paths **not executed**.

---

## Credential audit

**Source:** `evidence/credential-audit-20260717T193511Z.txt`

```
DATABASE_URL=UNSET
WILMS_SMOKE_EMAIL=UNSET
WILMS_SMOKE_PASSWORD=UNSET
WILMS_METRICS_TOKEN=UNSET
NEON_API_KEY=UNSET
RAILWAY_TOKEN=UNSET
VERCEL_TOKEN=UNSET
```

---

## Production smoke — blocked execution

**Command attempted:** `npm run smoke:production`  
**Log:** `evidence/smoke-no-creds-20260717T193511Z.log`

```
Error: WILMS_SMOKE_EMAIL and WILMS_SMOKE_PASSWORD are required for production smoke tests (demo accounts are disabled on live)
    at resolveSmokeCredentials (.../smoke-credentials.ts:15:13)
    at main (.../production-smoke.ts:67:31)
```

**Assessment:** Failure is **by design**. Production disables demo accounts; smoke requires dedicated non-demo credentials. This is **not** a software defect — it is an **operator-track gap**.

---

## Public probe results (Complete)

**Source:** `evidence/public-probes-20260717T193511Z.csv`

| Probe | HTTP | Latency | Expected | Result |
|-------|------|---------|----------|--------|
| `GET /health` | 200 | ~0.31s | JSON `status: ok`, `version: 1.3.8` | **Pass** |
| `GET /ops/metrics` (no auth) | 401 | ~0.11s | Reject anonymous | **Pass** |
| `GET /login` | 200 | ~0.20s | HTML contains `1.3.8` | **Pass** |
| `GET /api/auth/csrf` | 200 | ~0.17s | CSRF token available | **Pass** |
| `GET /ops` | 307 | ~0.07s | Auth redirect | **Pass** |

---

## Authenticated smoke — required steps (Pending)

When `WILMS_SMOKE_EMAIL` and `WILMS_SMOKE_PASSWORD` are provisioned, execute and attach logs:

| Step | Workflow | Status |
|------|----------|--------|
| 1 | Login via BFF (CSRF + session) | **Pending** |
| 2 | Fee assessment → loan approval | **Pending** |
| 3 | Disbursement | **Pending** |
| 4 | Field collection (GPS path) | **Pending** |
| 5 | Payment reversal | **Pending** |
| 6 | Expense recording | **Pending** |
| 7 | Reconciliation snapshot | **Pending** |
| 8 | Dashboard metrics read | **Pending** |

**Command:**

```bash
WILMS_SMOKE_EMAIL=<prod-user> \
WILMS_SMOKE_PASSWORD=<secret> \
npm run smoke:production -w @wilms/api
```

Save output to `evidence/smoke-production-<timestamp>.log`.

---

## RBAC smoke — per role (Pending)

| Role | Credential env | Status |
|------|----------------|--------|
| Super Admin | `WILMS_SMOKE_ADMIN_*` or shared smoke user | **Pending** |
| Collector | `WILMS_SMOKE_COLLECTOR_*` | **Pending** |
| Registration Officer | `WILMS_SMOKE_OFFICER_*` | **Pending** |
| Approver | `WILMS_SMOKE_APPROVER_*` | **Pending** |
| Auditor | `WILMS_SMOKE_AUDITOR_*` | **Pending** |

**Command:**

```bash
npm run smoke:rbac -w @wilms/api
```

---

## Closure criteria

| Criterion | Status |
|-----------|--------|
| `smoke:production` log attached, all steps green | **Pending** |
| `smoke:rbac` log attached, all roles pass | **Pending** |
| Demo account `admin@wilms.demo` rejected on prod | **Pending** |
| Evidence filed under `evidence/` with timestamp | **Pending** |

Until closure, live smoke remains **Pending** and blocks **✅ WILMS v1.3.8 Production Certified**.
