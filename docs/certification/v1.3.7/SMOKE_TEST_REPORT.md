# Smoke Test Report — v1.3.7

**Date:** 2026-07-13  
**Environment:** Production (https://wilms.vercel.app / https://wilms-production.up.railway.app)

---

## Automated production smoke

**Command:**

```bash
WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production -w @wilms/api
```

**Result:** **14/33 PASS** — **FAIL**

| Check | Result | Detail |
|-------|--------|--------|
| URLs not localhost | PASS | |
| API health HTTP 200 | PASS | status=degraded |
| Database connected | PASS | |
| gitCommit present | PASS | 7b3bdb27… |
| Schema ok | **FAIL** | degraded, 3 missing tables |
| Migrations ok | **FAIL** | 23/24 applied |
| Version present | PASS | 1.3.7 |
| Runtime metadata | PASS | node v20.20.2 |
| Frontend login page | PASS | HTTP 200 |
| CSRF token issued | PASS | |
| CSRF blocks login without token | PASS | HTTP 403 |
| BFF login | **FAIL** | HTTP 401 |
| Session cookie httponly | **FAIL** | no set-cookie |
| Login session | **FAIL** | |
| BFF proxy loans | **FAIL** | HTTP 401 |
| RBAC unauthenticated API | PASS | HTTP 401 |
| BFF proxy reports | **FAIL** | HTTP 401 |
| BFF proxy settings/dashboard/groups/pools/risk/messages/collectors/borrowers/portfolio | **FAIL** | HTTP 401 |
| BFF encoding (gzip JSON) | **FAIL** | HTTP 401 |
| No demo banner | PASS | |
| Photo capture public routes | PASS | HTTP 404 (expected) |

**Root cause of auth failures:** Default smoke credentials (`admin@wilms.demo` / `DemoAdmin1!`) return HTTP 401 in production. Demo accounts are not enabled on the live database.

---

## RBAC production smoke

**Command:**

```bash
WILMS_APP_URL=https://wilms.vercel.app npm run smoke:rbac -w @wilms/api
```

**Result:** **0/3 PASS** — **FAIL**

| Role | Login | Downstream checks |
|------|-------|-------------------|
| Admin | FAIL | Skipped |
| Collector | FAIL | Skipped |
| Registration officer | FAIL | Skipped |

---

## Manual workflow smoke

| Workflow | Status | Notes |
|----------|--------|-------|
| Login / logout | **BLOCKED** | No production credentials |
| Remember me | **BLOCKED** | |
| Password reset | **BLOCKED** | |
| MFA | **BLOCKED** | |
| Session expiry | **BLOCKED** | |
| App lock | **BLOCKED** | |
| Borrower registration (7-step) | **BLOCKED** | |
| Loan workflow (pool → completion) | **BLOCKED** | |
| Expenses | **BLOCKED** | |
| Messaging chain | **BLOCKED** | |
| Notifications (browser/in-app/sound) | **BLOCKED** | |
| Reports (CSV/Excel/PDF) | **BLOCKED** | |

---

## Verdict

Automated infrastructure checks (CSRF, public routes, unauthenticated RBAC) pass. **Authenticated end-to-end smoke cannot be certified** without production user credentials and a healthy database schema.

**Re-test after:** migrations applied + `WILMS_SMOKE_*` credentials provided.
