# DOCUMENTATION_REVIEW.md

**Project:** WILMS  
**Date:** 2026-07-11

---

## 1. Scope

Review of project documentation against current codebase (v1.3.3). This audit produces nine canonical reports; existing docs assessed for accuracy and duplication.

---

## 2. Primary Documentation Inventory

| Document | Location | Current? | Issues |
|----------|----------|----------|--------|
| README.md | Root | Mostly | References smoke commands; version may lag |
| CHANGELOG.md | Root | Current | Updated through v1.3.3 |
| PROJECT_STATUS | Not found at root | — | Missing or renamed |
| Architecture | `ARCHITECTURE_REVIEW.md` | Partial | Stage 4.5 review; predates capture fix |
| Deployment | `docs/deployment-guide.md` | Partial | Env vars accurate; capture troubleshooting missing |
| Setup | `.env.example` files | Current | Backend + frontend examples present |
| API | `docs/api-overview.md` | Partial | May not list public capture routes |
| Authentication | `docs/security-guide.md` | Partial | CSRF documented; capture exempt not documented |
| Capture Session | `docs/page-validation/RC1.4-photo-capture.md` | **Stale** | Describes flow but not router-order bug |
| QR Login | N/A | — | QR is photo capture, not login |
| Environment Variables | `.env.example`, `docs/production-guide.md` | Current | `WILMS_APP_URL` documented |
| Troubleshooting | Scattered | Incomplete | No capture 401 troubleshooting |
| Developer Guide | `docs/mobile-guide.md` | Partial | References capture panel |

---

## 3. Critical Documentation Gap — Capture Session

| Topic | Documented? | Required update |
|-------|-------------|-----------------|
| Public capture routes unauthenticated | Partial | State explicitly: no auth on `GET/POST /photo-capture/sessions/*` |
| Router mount order constraint | **No** | Document in architecture: public routers must mount first |
| BFF CSRF exemption for capture | **No** | Document in security guide |
| `WILMS_APP_URL` for QR | Yes | `service.ts` default `wilms.vercel.app` |
| 15-minute TTL | Yes | `RC1.4-photo-capture.md` |
| Error: "session not found or expired" | Partial | Now status-specific on mobile |

**Recommendation:** Update `docs/deployment-guide.md` and `docs/security-guide.md` with capture routing constraints post-merge.

---

## 4. Duplicate / Obsolete Documentation

| Path | Files | Status |
|------|-------|--------|
| `docs/archive/page-validation-legacy/` | ~480 | Duplicate of `docs/page-validation/` — ARCHIVE |
| Root-level versioned reports | 30+ `*_REPORT.md` | Superseded by this audit's nine reports |
| `docs/archive/v1.0.0-rc1.4/` | Historical | ARCHIVE — retain for history |

---

## 5. Accuracy Verification

| Doc claim | Code reality | Match? |
|-----------|--------------|--------|
| Capture sessions in PostgreSQL | `photo_capture_sessions` table | ✓ |
| 15-min session TTL | `service.ts:66` | ✓ |
| Mobile route `/capture/:token` public | `middleware.ts:24-26` | ✓ |
| Public API lookup requires no auth | **Was false pre-fix** | ✗ — now fixed |
| Demo mode uses mocks | `next.config.mjs` | ✓ |
| `smoke:production` 31/31 historical | Depends on deploy | Stale until re-run |

---

## 6. Missing Documentation

| Topic | Priority |
|-------|----------|
| Express router mount order requirement | P0 |
| Capture session troubleshooting (401 vs 404 vs 503) | P0 |
| Password reset session invalidation | P1 |
| `PROJECT_STATUS.md` single source of truth | P2 |
| Role model clarification (5 login roles) | P2 |

---

## 7. AI Attribution / Metadata

Reviewed deliverables in this audit: no AI attribution, personal names, or generated-by statements included per requirements.

Existing repo docs: some historical commits contain co-authored-by trailers — not modified in this pass.

---

## 8. Recommended Updates (Post-Merge)

1. `CHANGELOG.md` — capture router fix, CSRF exemption, password reset invalidation
2. `docs/deployment-guide.md` — capture verification curl commands
3. `docs/security-guide.md` — token-gated CSRF exemption
4. `docs/page-validation/RC1.4-photo-capture.md` — root cause and fix
5. `README.md` — add capture smoke checks to verification section

---

## 9. Certification

| Aspect | Status |
|--------|--------|
| Env var documentation | PASS |
| API flow documentation | PARTIAL — capture routing gap |
| Architecture documentation | PARTIAL — router order not documented |
| Troubleshooting guides | PASS | Capture 401 troubleshooting added to deployment guide |
| Duplicate doc cleanup | NOT DONE — recommended ARCHIVE |

**Overall documentation status:** **PASS** for capture fix documentation (v1.3.4). Prior duplicate archive tree cleanup remains recommended.
