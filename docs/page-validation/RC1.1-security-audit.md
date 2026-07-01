# RC1.1 — Security Audit

**Date:** 2026-07-01  
**Scope:** Post hotfix `8e0df23`

---

## Hotfix security impact

| Control | Before | After |
|---------|--------|-------|
| Collector self-access | Router blocked all collector routes | `assertCollectorAccess` enforces owner-or-admin |
| Cross-collector access | Possible if router passed | 403 when `session.userId !== collectorId` |
| Permission bleed | Router `use()` denied unrelated APIs | Scoped per-route only |
| CSRF on uploads | Missing bootstrap caused 403 | `ensureCsrfToken()` in `apiClient` (inherited from PR #41) |
| Admin-fee data leak | Collector UI called approver eligibility | Gated behind `APPROVE_LOANS` |

---

## Unchanged controls (verified)

- Helmet + HSTS in production
- CORS `credentials: true` with explicit origin
- BFF CSRF on login/logout and mutating `/api/wilms/*`
- `requireAuth` on business routes
- gitleaks + `npm audit --audit-level=critical` in CI
- Cloudinary upload validation
- Production mock guard (`NEXT_PUBLIC_USE_MOCK=false`)

---

## Production smoke (security-relevant)

| Check | Result |
|-------|--------|
| CSRF blocks login without token | 403 |
| Session cookie HttpOnly | PASS |
| Unauthenticated API `/loans` | 401 |
| Officer blocked from collector dashboard | 403 |

---

## Verdict

**PASS** — Hotfix tightens collector portal isolation without weakening existing controls.
