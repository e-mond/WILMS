# WILMS — Project Status

**Last updated:** 2026-07-05 (RC1.4 final closure)  
**Current release:** v0.2.2  
**Branch:** `release/rc1-4-final-closure` (from `main` @ `487708b`)  
**Overall readiness:** **82%** — see `RC1.4_CLOSURE_REPORT.md`

---

## Executive summary

WILMS is **operational in production** (Railway + Vercel synced on `487708b`). RC1.4 closure fixes are on branch `release/rc1-4-final-closure`. **Version 1.0 is conditionally ready** (78%) — merge closure branch, then complete production DB audit and dependency CVE remediation before tagging v1.0.

---

## Production (verified 2026-07-05)

| Service | URL | Commit / status |
|---------|-----|-----------------|
| Frontend | https://wilms.vercel.app | Auto-deploy from `main`; login 200 |
| Backend | https://wilms-production.up.railway.app | `487708b` — `verify:deploy-sync` **PASS** |
| Database | Neon (via Railway) | 13/13 migrations, schema ok |
| Cloudinary | Railway env | `cloudinaryConfigured: true` |

---

## Verification snapshot (2026-07-05)

| Check | Result |
|-------|--------|
| `verify:deploy-sync` | **PASS** |
| `smoke:rbac` | **11/11** |
| `smoke:production` | **31/32** (stale `EXPECTED_GIT_COMMIT` in local `.env`) |
| Backend tests | **53/53** |
| Frontend tests | **224/224** |
| `npm audit` | **18 vulnerabilities** (9 moderate, 9 high) |

---

## RC1.4 closure status

| Area | Status |
|------|--------|
| Deploy sync | ✅ Complete |
| Mobile QR capture | ✅ Fixed (middleware, upload, polling, simulate) |
| Registration autosave | ✅ Debounced draft save on all steps |
| Guarantor eligibility | ✅ Pending registrations excluded from limit |
| A11y test regressions | ✅ Fixed (Toast, Modal, PasswordField, PendingApplicationReview) |
| App lock | ✅ Optional — mandatory setup gate removed |
| Connection status UI | ✅ Bottom-right floating chip |
| Login/logout sounds | ✅ Optional audio on auth events |
| Production data audit | ⏳ **Unverified** — Neon row-count probe required |
| Dependency CVEs | ⏳ drizzle, next, dompurify |
| v1.0 tag | ⏳ After DB audit + CVE fixes |

---

## Deliverables

- `RC1.4_CLOSURE_REPORT.md` — final closure assessment  
- `PROJECT_READINESS_REPORT.md`, `FINAL_RECOMMENDATION.md`, and related audit reports

---

## Quick verification

```bash
EXPECTED_GIT_COMMIT=$(git rev-parse HEAD) WILMS_API_URL=https://wilms-production.up.railway.app npm run verify:deploy-sync
WILMS_APP_URL=https://wilms.vercel.app WILMS_API_URL=https://wilms-production.up.railway.app npm run smoke:production
WILMS_APP_URL=https://wilms.vercel.app npm run smoke:rbac
npm run test -w @wilms/api && npm run test -w @wilms/frontend
```

---

## Next steps

1. Merge `release/rc1-4-final-closure` PR  
2. Production Neon data audit (reference users only, no financial demo data)  
3. Upgrade drizzle-orm and next.js to patched versions  
4. Re-run smoke + E2E on deployed commit  
5. Tag `v1.0.0`
