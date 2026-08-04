# RC1.3.2 — API Verification

**Date:** 2026-07-02T22:45:00Z  
**Repo gates:** `main` @ `8a83278`  
**Production:** wilms.vercel.app → wilms-production.up.railway.app

---

## Summary

| Gate | Result |
|------|--------|
| API integrity (132 routes) | **PASS** |
| API coverage (0 placeholders) | **PASS** |
| Mock guard | **PASS** |
| Production smoke (29 checks) | **FAIL 17/29** |
| RBAC smoke (11 checks) | **FAIL 7/11** |
| ERR_CONTENT_DECODING_FAILED | **Not observed** (500s dominate; encoding checks fail on status) |

**Overall: FAIL** — Contract complete in repo; production list endpoints return HTTP 500.

---

## Repository integrity

```
verify:api-integrity  → PASS (132/132 frontend paths → backend routes)
verify:api-coverage   → PASS (46 pages, 0 placeholder hits)
verify:mock-guard     → PASS (no forbidden mock imports in features/)
```

---

## Production smoke matrix (2026-07-02T22:41:54Z)

| Check | Status | HTTP |
|-------|--------|------|
| api-health-status | PASS | 200 |
| api-health-database | PASS | — |
| api-health-version | PASS | — |
| api-health-migrations | PASS | 11/11 |
| api-health-runtime | PASS | node v20.20.2 |
| frontend-login-page | PASS | 200 |
| csrf-token-issued | PASS | 200 |
| csrf-blocks-login-without-token | PASS | 403 |
| bff-login | PASS | 200 |
| session-cookie-httponly | PASS | — |
| login-session | PASS | — |
| bff-proxy-loans | **FAIL** | **500** |
| rbac-unauthenticated-api | PASS | 401 |
| bff-proxy-reports | PASS | 200 |
| bff-proxy-settings-me | PASS | 200 |
| bff-proxy-dashboard | **FAIL** | **500** |
| bff-proxy-groups | **FAIL** | **500** |
| bff-proxy-loan-pools | **FAIL** | **500** |
| bff-proxy-risk-flags | **FAIL** | **500** |
| bff-proxy-messages | **FAIL** | **500** |
| bff-proxy-collectors | **FAIL** | **500** |
| bff-proxy-borrowers | **FAIL** | **500** |
| bff-proxy-loans-portfolio | **FAIL** | **500** |
| bff-encoding-dashboard | **FAIL** | **500** |
| bff-encoding-borrowers | **FAIL** | **500** |
| bff-encoding-collectors | **FAIL** | **500** |
| no-demo-banner-on-login | PASS | — |

---

## Module status (production)

| Module | Primary route | Prod status | Notes |
|--------|---------------|-------------|-------|
| Authentication | `/api/auth/login`, CSRF | PASS | Session + HttpOnly cookie |
| Dashboard | `/dashboard/summary` | **FAIL 500** | Blocker |
| Borrowers | `/borrowers` | **FAIL 500** | Blocker |
| Loans | `/loans?status=ACTIVE` | **FAIL 500** | Blocker |
| Loan portfolio | `/loans/portfolio` | **FAIL 500** | Blocker |
| Loan Pools | `/loan-pools` | **FAIL 500** | Blocker |
| Groups | `/groups` | **FAIL 500** | Blocker |
| Collectors | `/collectors` | **FAIL 500** | Blocker |
| Risk Flags | `/risk-flags` | **FAIL 500** | Blocker |
| Messages | `/messages/threads` | **FAIL 500** | Blocker |
| Reports hub | `/reports` | PASS 200 | Static catalog |
| Settings | `/settings/me` | PASS 200 | User profile |
| Applications | `/borrowers?status=PENDING` | **Likely 500** | Same borrowers handler |
| Notifications | `/notifications` | Not in smoke | Untested live |
| Search | Global search API | Not in smoke | Untested live |
| Uploads | `/uploads` | Not in smoke | CSRF/RBAC tested in RC1.1 |
| Collections / Reconciliation | Collector routes | **FAIL** (RBAC smoke) | See auth doc |

---

## RBAC production matrix

| Check | Result |
|-------|--------|
| admin-login | PASS |
| admin-dashboard-summary | **FAIL** (500) |
| admin-settings-users | PASS |
| admin-collectors | **FAIL** (500) |
| collector-login | PASS |
| collector-own-dashboard | **FAIL** (500) |
| collector-blocked-admin-dashboard | PASS (403) |
| collector-blocked-settings-users | PASS (403) |
| collector-reconciliation | **FAIL** (500) |
| officer-login | PASS |
| officer-blocked-dashboard | PASS (403) |

**Score: 7/11**

---

## Root cause hypothesis (evidence-based)

1. **Deploy drift:** Railway runs `cf3ce10`, not current `main` — may lack empty-DB fixes and RC1.3 UX backend paths.
2. **Empty / rebuilt database:** List aggregations error server-side (500), not 403/404.
3. **BFF pass-through:** Failures originate upstream (BFF login/reports pass; same session fails on list routes).

**Required next step:** Railway runtime logs + redeploy from `main` (or merged RC1.3) before re-certification.

---

## Pass gate

Production smoke **29/29** and RBAC **11/11** required. **NOT MET.**
