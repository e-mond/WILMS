# WILMS — Project Status

**Last updated:** 2026-07-04  
**Current release:** v0.2.2  
**Active phase:** RC1.4 — production verification & v1.0 certification  
**Branch:** `main` @ `6aef129` (+ local a11y + registration export fixes pending push)

---

## Executive summary

RC1.4 is deployed to production. Frontend (Vercel) and backend (Railway) are synced on commit `6aef129`. Recent work: integration status embedded in settings API, mobile settings nav, guarantor photo URLs, role settings wiring, admin dashboard export, registration review export permission fix, and Vercel accessibility pass (button labels / visible-text naming).

---

## Production

| Service | URL | Commit (last verified) |
|---------|-----|------------------------|
| Frontend | https://wilms.vercel.app | Auto-deploy from `main` |
| Backend | https://wilms-production.up.railway.app | `6aef129` — `verify:deploy-sync` PASS |

Railway env: SMS (SMSNotifyGH) + email (Gmail SMTP) configured by operator.

---

## RC1.4 progress

| Area | Status |
|------|--------|
| Deploy sync verification | ✅ `npm run verify:deploy-sync` |
| Registration drafts + photo capture | ✅ Implemented |
| Guarantor validation + readable IDs | ✅ Implemented |
| Unified export (`WilmsExportModal`) | ✅ Reports, admin, approval, my-registrations; **registration review step** wired for `REGISTER_BORROWERS` |
| SMS/email integration status UX | ✅ Embedded in `GET /settings` |
| Mobile pill nav + settings access | ✅ Restored for officer roles |
| Role settings (profile, notifications, prefs) | ✅ Wired (localStorage + API where applicable) |
| Accessibility (Vercel) | 🔄 In progress — icon buttons use sr-only text; removed conflicting aria-label overrides |
| Notification sounds (global login/logout) | ⏳ Hook exists; not globally wired |
| Admin route stubs (live API 404s) | ⏳ Some report/backend stubs remain |
| v1.0 certification tag | ⏳ After full smoke + UAT |

---

## Quick verification

```bash
EXPECTED_GIT_COMMIT=$(git rev-parse HEAD) WILMS_API_URL=https://wilms-production.up.railway.app npm run verify:deploy-sync
npm run smoke:production
npm run smoke:rbac
npm run type-check
npm run build -w @wilms/frontend
curl -s https://wilms-production.up.railway.app/health | jq '.data | {gitCommit, schema, migrations, runtime}'
```

---

## Smoke / test notes

- Production smoke: 31/31 endpoints (when API env configured)
- RBAC smoke: 11/11 role checks
- Frontend Vitest: SuperAdminDashboard timeout fixed; some Windows-local flakes possible on full suite
- Manual UAT: Settings → Integrations, registration review export, mobile nav, guarantor photo on approver review

---

## Next steps

1. Commit + push a11y + registration export fixes; confirm Vercel redeploy
2. Re-run Vercel Accessibility audit on login + registration officer shell
3. Full production smoke after push
4. Tag `v1.0.0` when UAT passes
