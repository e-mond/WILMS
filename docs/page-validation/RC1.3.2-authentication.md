# RC1.3.2 — Authentication Verification

**Date:** 2026-07-02T22:45:00Z

---

## Summary

**Result: PARTIAL PASS** — Login, CSRF, session cookies, and RBAC denial paths work. Role-specific **data routes fail with 500** (not auth failures).

---

## Production smoke (auth)

| Check | Result |
|-------|--------|
| CSRF token issued | PASS |
| Login blocked without CSRF | PASS (403) |
| BFF login | PASS (200) |
| Session cookie HttpOnly | PASS |
| Unauthenticated API | PASS (401) |
| Demo banner absent | PASS |

---

## RBAC smoke by role

### SUPER_ADMIN (`admin@wilms.demo`)

| Route | Expected | Actual |
|-------|----------|--------|
| Login | 200 | PASS |
| `/dashboard/summary` | 200 | **500** |
| `/settings/users` | 200 | PASS |
| `/collectors` | 200 | **500** |

### COLLECTOR

| Route | Expected | Actual |
|-------|----------|--------|
| Login | 200 | PASS |
| Own dashboard | 200 | **500** |
| Admin dashboard | 403 | PASS |
| Settings users | 403 | PASS |
| Reconciliation | 200 | **500** |

### REGISTRATION_OFFICER

| Route | Expected | Actual |
|-------|----------|--------|
| Login | 200 | PASS |
| Admin dashboard | 403 | PASS |

APPROVER and AUDITOR not exercised in RBAC smoke this run.

---

## Session / security controls (repository)

| Control | Status | Reference |
|---------|--------|-----------|
| HMAC signed session | Implemented | `middleware/authenticate.ts` |
| CSRF double-submit (BFF) | PASS live | smoke |
| Login rate limit | Implemented | `login-rate-limit.ts` |
| bcrypt passwords | Implemented | `lib/password.ts` |
| App lock (client) | Implemented | `NEXT_PUBLIC_APP_LOCK_IDLE_MS` |
| Server session revocation | Not implemented | TD-04 documented |

---

## Pass gate

Authentication mechanics: **PASS**. Authorized data access for all roles: **FAIL** (500s). RBAC smoke: **7/11**.
