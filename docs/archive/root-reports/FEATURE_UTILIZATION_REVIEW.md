# FEATURE_UTILIZATION_REVIEW.md

**Project:** WILMS  
**Date:** 2026-07-11  
**Method:** Static import analysis + code review. Removal recommendations require zero external references verified by grep.

---

## Classification Key

- **KEEP** — Active, referenced, production path
- **MERGE** — Duplicate functionality; consolidate
- **ARCHIVE** — Historical docs or deprecated but referenced
- **REMOVE** — Zero references verified; safe to delete

---

## 1. Core Production Features — KEEP

| Feature | Evidence | Justification |
|---------|----------|---------------|
| Photo capture (QR mobile) | `photo-capture/` module, `PhoneCaptureSessionPanel` | Active registration workflow |
| Offline payment/expense queue | `offline-queue/`, `useOfflineQueueSync` | Field ops v1.3.x |
| Communication center | `communications/routes.ts` | v1.2 platform |
| User invitation lifecycle | `settings/invitation.test.ts` | v1.2.1+ |
| Password reset | `password-reset.service.ts` | Production auth |
| PWA update prompt | `AppUpdatePrompt.tsx` | v1.3.3 |
| Holiday-aware schedules | `holiday-schedule.test.ts` | v1.3.2 |
| RBAC permission overrides | `resolve-user-permissions.ts` | Admin settings |

---

## 2. Dual-Stack (Mock vs API) — KEEP

| Component | Mode | Evidence |
|-----------|------|----------|
| `MockDataProvider` | Development/demo | `index.development.ts` |
| `ApiDataProvider` | Production | `index.production.ts` |
| Mock import guard | CI | `verify:mock-guard` PASS |
| `photoCaptureSessionService.mock.ts` | Dev only | In-memory Map — **not** production path |

**Risk documented:** Dev mock capture sessions do not persist to DB; mobile always hits API. Officers in mock mode see QR but mobile gets 404 — expected dev limitation.

---

## 3. Duplicate / Legacy — MERGE or ARCHIVE

| Item | Classification | Evidence | Action |
|------|----------------|----------|--------|
| `docs/archive/page-validation-legacy/` | ARCHIVE | ~480 files mirroring `docs/page-validation/` | Archive or delete after confirming no CI references |
| `collector-dashboard.utils` (`@deprecated`) | ARCHIVE | Still imported by mocks + tests (7+ files) | Migrate callers before removal |
| `csv-engine` deprecated exports | ARCHIVE | Tests + `useWilmsExport` | Keep until export migration complete |
| `config/demo.ts` (`@deprecated`) | ARCHIVE | `LoginForm.tsx` | Keep for demo mode |
| `RoleGuard` vs `PermissionRouteGuard` | MERGE | All role layouts use `RoleGuard` | Consolidate when layouts migrated |

---

## 4. Zero-Reference Candidates — REMOVE (Not auto-deleted)

| Item | References | Verification |
|------|------------|--------------|
| `apps/frontend/src/utils/export-group-profile.ts` | **0** imports | `rg` across `*.{ts,tsx}` |
| `ROLE_HOME_PATH` in `lib/auth/routes.ts` | **0** imports | Only definition exists |

**Recommendation:** REMOVE in dedicated cleanup PR with CI pass.

---

## 5. Narrow UI Surface — KEEP (Backend complete)

| Feature | Backend | Frontend UI | Status |
|---------|---------|-------------|--------|
| Overpayment reviews | `overpayment-reviews/routes.ts` | `OverpaymentReviewPanel` on `/risk-flags` | KEEP — intentional |
| Group formation queue | `group-formation/routes.ts` | Service layer only | KEEP — API ready |
| Analytics collections | `analytics/routes.ts` | Dashboard summary hook | KEEP |

---

## 6. Experimental / Incomplete

| Feature | Status | Evidence |
|---------|--------|----------|
| WebSocket capture sync | Not implemented | Desktop uses 2s polling |
| Multipart file upload | Not implemented | dataUrl JSON only — `uploads/routes.ts:118` |
| Global API rate limit | Not implemented | Per-endpoint only |
| Capture session cleanup cron | Not implemented | Lazy expiry only |

---

## 7. Obsolete Reports at Repo Root

Multiple versioned reports exist (`V1.2.2_SECURITY_REPORT.md`, `V1.2.3_PLATFORM_STABILIZATION_REPORT.md`, etc.). This audit generates fresh canonical reports. Prior reports should be **ARCHIVE** after stakeholder review — not deleted without confirmation.

---

## 8. Summary Table

| Classification | Count (this review) |
|----------------|---------------------|
| KEEP | 15+ core features |
| MERGE | 2 (RoleGuard, export utilities) |
| ARCHIVE | 5+ (deprecated code, legacy docs) |
| REMOVE | 2 verified zero-reference files |

**No features auto-removed in this stabilization pass** per audit instructions.
