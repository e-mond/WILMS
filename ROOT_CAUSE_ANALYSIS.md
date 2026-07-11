# ROOT_CAUSE_ANALYSIS.md

**Project:** WILMS (Women's Interest-Free Loan Management System)  
**Release line:** v1.3.3 stabilization (audit scope references v1.2.x–v1.3.x)  
**Date:** 2026-07-11  
**Primary issue:** Mobile capture session — "Capture session not found or expired"

---

## Executive Summary

The mobile capture workflow failed because **public photo-capture API routes were unreachable without authentication**. Express mounted authenticated business routers before the photo-capture router. Every `/api/v1/*` request entered `loansRouter` first, whose blanket `requireAuth` middleware returned **401** before the photo-capture handler could run.

A **secondary defect** blocked mobile upload after session lookup: the BFF proxy required CSRF tokens on all mutating `/api/wilms/*` requests, but the mobile capture page does not obtain CSRF cookies.

Storage architecture (PostgreSQL) is correct for distributed deployment. The failure was routing/middleware ordering, not persistence or QR generation.

---

## Investigation Method

| Step | Action | Evidence |
|------|--------|----------|
| 1 | Traced session create → store → validate in source | `photo-capture/service.ts`, `photo-capture.repository.ts` |
| 2 | Reproduced production failure | `curl https://wilms.vercel.app/api/wilms/photo-capture/sessions/pcs_testinvalid123456` → **401** |
| 3 | Reproduced on Railway direct | `curl https://wilms-production.up.railway.app/api/v1/photo-capture/sessions/pcs_testinvalid123456` → **401** |
| 4 | Reproduced locally without code changes | `createApp()` local server → **401** unauthenticated |
| 5 | Confirmed with authenticated request | Same endpoint with Bearer token → **503** (no local DB) — proves route exists but auth blocked first |
| 6 | Verified fix locally | After router reorder → **503** without auth (DB gate), **200** for `/locations/regions` |

---

## Session Lifecycle (Evidence)

### Creation (desktop)

| Property | Value | File |
|----------|-------|------|
| Endpoint | `POST /api/v1/registration/capture-sessions` | `photo-capture/routes.ts:48-58` |
| Auth | `requireAuth` + `CAPTURE_DOCUMENTS` | Same |
| Token format | `pcs_` + 16 hex chars | `photo-capture/service.ts:38` |
| TTL | 15 minutes | `service.ts:66` |
| Storage | PostgreSQL `photo_capture_sessions` | `0011_rc14_registration_capture.sql` |
| QR URL | `{WILMS_APP_URL}/capture/{token}` | `service.ts:32-34` |

### Lookup (mobile)

| Property | Value | File |
|----------|-------|------|
| Page | `/capture/[token]` | `app/capture/[token]/page.tsx` |
| BFF call | `GET /api/wilms/photo-capture/sessions/:token` | Same L25 |
| Backend route | `GET /api/v1/photo-capture/sessions/:token` | `photo-capture/routes.ts:78-90` |
| Auth required | **No** (by design) | Route has no `requireAuth` |

### Validation

| Check | Mechanism | File |
|-------|-----------|------|
| Exists | `getPhotoCaptureSession(sessionToken)` | `photo-capture.repository.ts:60-70` |
| Expired | Lazy check on read; status → `EXPIRED` | `service.ts:52-57, 90-95` |
| DB required | `requireDatabase()` → 503 | `service.ts:26-29` |

---

## Root Cause #1 (Primary) — Express Router Mount Order

**Severity:** P0 — Critical  
**Symptom:** Mobile shows "Capture session not found or expired" immediately after QR scan  
**HTTP status:** 401 (collapsed to generic message by mobile UI)

### Evidence

`mountBusinessRoutes()` in `apps/backend/src/http/app.ts` mounted `loansRouter` (and 20+ other routers with `router.use(requireAuth)`) **before** `photoCaptureRouter`.

Express invokes mounted routers at `/api/v1` in registration order. `loansRouter.use(requireAuth)` runs for **every** `/api/v1` request entering that router, regardless of whether a loans route matches.

```typescript
// loans/routes.ts — pattern repeated across 24 modules
loansRouter.use(requireAuth);
```

Unauthenticated mobile GET hits `loansRouter` first → `requireAuth` → 401. `photoCaptureRouter` never executes.

### Why desktop QR still appeared to work

Session **creation** uses `POST /registration/capture-sessions`, which is also on `photoCaptureRouter` but was similarly blocked for... wait, creation requires auth from desktop with session cookie. Desktop officer is authenticated, so when the request hits `loansRouter.requireAuth`, it passes and then... 

Actually for authenticated desktop POST to `/registration/capture-sessions`:
1. loansRouter receives request
2. requireAuth passes (officer has session)
3. No loans route matches → falls through to next router
4. Eventually photoCaptureRouter matches POST /registration/capture-sessions → session created in DB

For unauthenticated mobile GET:
1. loansRouter receives request  
2. requireAuth fails → **401 immediately**

### Fix implemented

Reordered `mountBusinessRoutes()` to mount `photoCaptureRouter` and `locationsRouter` (which also has public sub-routes) **before** any router with blanket `requireAuth`.

**Files affected:** `apps/backend/src/http/app.ts`

**Verification:**
- Local unauthenticated GET → 503 (no DB) or 404 (with DB), **not 401**
- New test: `apps/backend/src/tests/photo-capture/public-routes.test.ts` (3 cases)
- Backend suite: **100/100 PASS**

**Remaining risk:** Any future router mounted before public routers with blanket `requireAuth` could reintroduce the bug. Comment added in `app.ts` documenting the constraint.

---

## Root Cause #2 (Secondary) — BFF CSRF on Mobile Upload

**Severity:** P1 — High (blocks upload after lookup fix)  
**Symptom:** Upload would fail with 403 after session loads  
**Evidence:** `apps/frontend/src/app/api/wilms/[...path]/route.ts` applied `rejectInvalidCsrf()` to all non-GET requests; mobile page POST has no CSRF cookie/header

### Fix implemented

Exempt `photo-capture/sessions/*` paths from CSRF in BFF proxy. Backend upload remains token-gated.

**Files affected:** `apps/frontend/src/app/api/wilms/[...path]/route.ts`

**Verification:** Code review; production smoke extended with `bff-photo-capture-public-upload-no-csrf` check.

---

## Root Cause #3 (Contributing) — Generic Mobile Error Message

**Severity:** P2 — Medium  
**Symptom:** 401 displayed as "Capture session not found or expired"  
**Evidence:** `capture/[token]/page.tsx` mapped all non-503 errors to one string

### Fix implemented

Status-specific messages using `extractApiErrorMessage()`.

**Files affected:** `apps/frontend/src/app/capture/[token]/page.tsx`

---

## Ruled Out (With Evidence)

| Hypothesis | Ruling | Evidence |
|------------|--------|----------|
| In-memory session store | **Ruled out** | Backend uses PostgreSQL; mock `Map` is frontend-only in dev |
| Deployment not applied | **Partially ruled out** | Production returns 401 matching local pre-fix behaviour — code defect, not env drift alone |
| Session expiration | **Ruled out for initial error** | Expired sessions return HTTP 200 + `status: EXPIRED`; different UI path |
| `WILMS_APP_URL` mismatch | **Not primary** | Would cause 404 on wrong DB, not systematic 401 on correct domain |
| Service worker cache | **Ruled out** | `sw.js` bypasses `/capture/` and `/api/` |
| Missing migration | **Ruled out** | Desktop session creation succeeds in production (user report: QR generated) |

---

## Observability Added

Structured logging in `photo-capture/service.ts`:
- `photoCapture.session.created`
- `photoCapture.session.notFound`
- `photoCapture.session.completed`

Production smoke extended (`production-smoke.ts`):
- `bff-photo-capture-public-lookup`
- `bff-photo-capture-public-upload-no-csrf`

---

## Post-Deploy Verification Required

Not verified—requires runtime verification after deploy:

```bash
# Must NOT return 401
curl -sS -o /dev/null -w "%{http_code}" \
  "https://wilms.vercel.app/api/wilms/photo-capture/sessions/pcs_invalid00000001"
# Expected: 404 or 503

WILMS_APP_URL=https://wilms.vercel.app \
WILMS_API_URL=https://wilms-production.up.railway.app \
npm run smoke:production -w @wilms/api
```

End-to-end mobile capture (QR scan → camera → upload → desktop poll) requires physical device test post-deploy.
