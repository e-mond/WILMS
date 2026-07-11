# ENGINEERING_AUDIT_REPORT.md

**Project:** WILMS  
**Audit type:** Production stabilization (no new features)  
**Date:** 2026-07-11  
**Codebase version:** 1.3.3 (`package.json`)

---

## 1. Scope

Full-stack engineering review across backend, frontend, BFF, infrastructure configuration, and critical workflows. Primary focus: mobile capture session failure.

---

## 2. Critical Finding — Mobile Capture (P0)

| Field | Detail |
|-------|--------|
| **Severity** | P0 — Critical |
| **Evidence** | Production `curl` → 401; local `createApp()` → 401 unauthenticated; authenticated → 503 (route reachable) |
| **Root cause** | Express router mount order: blanket `requireAuth` on `loansRouter` intercepted all `/api/v1` traffic before `photoCaptureRouter` |
| **Files** | `apps/backend/src/http/app.ts`, `apps/frontend/src/app/api/wilms/[...path]/route.ts`, `apps/frontend/src/app/capture/[token]/page.tsx` |
| **Fix** | Mount public routers first; exempt capture paths from BFF CSRF; improve mobile error messages |
| **Verification** | `public-routes.test.ts` 3/3; backend 100/100; local endpoint 503 not 401 |
| **Remaining risk** | E2E mobile capture on production not run in this environment |

---

## 3. Backend Engineering

### 3.1 Architecture

| Component | Mechanism | Distributed-safe |
|-----------|-----------|------------------|
| API | Express on Railway | Yes |
| BFF | Next.js on Vercel | Yes (serverless) |
| Sessions (capture) | PostgreSQL `photo_capture_sessions` | Yes |
| Sessions (auth) | HMAC-signed tokens + `session_version` | Yes |
| Uploads | DB metadata + Cloudinary/local | Cloudinary: yes; local disk: no (multi-instance) |
| Offline queue | IndexedDB (frontend) | Client-local by design |

### 3.2 Routes & Middleware

- **29 backend test files, 100 tests** — all PASS (2026-07-11)
- API integrity gate: PASS (`verify:api-integrity`)
- API coverage gate: PASS — 54 pages, 0 placeholders
- Global middleware: Helmet, CORS, `optionalAuth`, JSON 15mb limit
- Error envelope: `{ data }` / `{ error: { message, code } }`

### 3.3 Database

- ORM: Drizzle + Neon serverless driver
- Migrations: SQL files in `apps/backend/src/db/migrations/`
- Capture table: `0011_rc14_registration_capture.sql`
- Health endpoint reports schema/migration status

### 3.4 Issues Found & Fixed

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| BE-01 | P0 | Public capture routes return 401 | Router mount reorder |
| BE-02 | P1 | Password reset does not invalidate sessions | `invalidateUserSessions()` in `password-reset.service.ts` |
| BE-03 | P2 | No structured logging on capture lifecycle | Added `logger.info/warn` events |

### 3.5 Dead Code (Verified Zero References)

| Item | Evidence | Recommendation |
|------|----------|----------------|
| `export-group-profile.ts` | 0 imports | REMOVE (not removed in this pass — report only) |
| `ROLE_HOME_PATH` alias | 0 imports | REMOVE |

---

## 4. Frontend Engineering

### 4.1 Architecture

- Next.js 14 App Router
- TanStack Query + Zustand
- Webpack alias switches mock vs production services (`next.config.mjs`)
- Production always uses API services (`resolveDataProviderMode()`)

### 4.2 Capture Workflow

| Step | Component | Status |
|------|-----------|--------|
| QR generation | `PhoneCaptureSessionPanel.tsx` | OK |
| Desktop polling | 2s interval via `photoCaptureSessionService` | OK |
| Mobile page | `/capture/[token]` public route | Fixed (error handling) |
| SW bypass | `/capture/`, `/api/` | OK (`sw.js`) |

### 4.3 Tests

- **85 test files, 233 tests** — all PASS (2026-07-11)
- `fake-indexeddb` polyfill in vitest setup (prevents unhandled rejections)

### 4.4 Issues Found

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| FE-01 | P0 | BFF CSRF blocks mobile upload | Fixed |
| FE-02 | P2 | Generic capture error masks 401 | Fixed |
| FE-03 | P3 | `RoleGuard` marked legacy but still used | KEEP — document migration |

---

## 5. Infrastructure & Routing

### 5.1 Request Path (Capture)

```
Desktop: apiClient → /api/wilms/registration/capture-sessions → BFF → Railway /api/v1/...
Mobile:  fetch → /api/wilms/photo-capture/sessions/:token → BFF → Railway /api/v1/...
```

### 5.2 Environment Variables (Capture-critical)

| Variable | Service | Required |
|----------|---------|----------|
| `DATABASE_URL` | Railway | Yes |
| `WILMS_API_UPSTREAM` | Vercel | Yes (production) |
| `WILMS_APP_URL` | Railway | Yes (QR URL) |
| `WILMS_SESSION_SECRET` | Railway | Yes |
| `WILMS_CORS_ORIGIN` | Railway | Yes |
| `NEXT_PUBLIC_API_BASE_URL` | Vercel build | Yes |

### 5.3 Production Probe (Pre-Fix)

| Endpoint | Status | Body |
|----------|--------|------|
| `wilms.vercel.app/.../photo-capture/sessions/invalid` | 401 | `Authentication required` |
| `wilms-production.up.railway.app/.../photo-capture/sessions/invalid` | 401 | Same |

---

## 6. Technical Debt Addressed

- Router mount ordering documented in `app.ts`
- Capture public route regression tests added
- Production smoke extended for capture endpoints
- Password reset session invalidation aligned with suspend/role-change behaviour

---

## 7. Technical Debt Remaining

| Item | Severity | Notes |
|------|----------|-------|
| 24 routers use blanket `router.use(requireAuth)` | Medium | Fragile pattern; prefer route-level auth or public router partition |
| No global API rate limit | Medium | Per-endpoint limits only |
| `legacyRecordPaymentSchema` still active | Low | Documented in payments routes |
| `docs/archive/page-validation-legacy/` duplicate tree | Low | ~480 duplicate files |
| Open redirect in tracking `?url=` | Medium | See security report |

---

## 8. Verification Summary

| Check | Result | Evidence |
|-------|--------|----------|
| `npm run type-check` | PASS | 2026-07-11 |
| `npm run lint` | PASS | No ESLint warnings |
| `npm run build` | PASS | Next.js production build |
| Backend tests | **100/100** PASS | vitest |
| Frontend tests | **233/233** PASS | vitest |
| `verify:api-integrity` | PASS | |
| `verify:api-coverage` | PASS | |
| `verify:mock-guard` | PASS | |
| `smoke:production` | Not verified—requires runtime | Needs `WILMS_APP_URL` + credentials |
| Mobile E2E capture | Not verified—requires runtime | Physical device + deployed fix |

---

## 9. Release Recommendation

**Conditional GO** — merge and deploy capture fix; run production smoke and manual mobile capture test before certifying production.
