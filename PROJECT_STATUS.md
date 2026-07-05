# WILMS - Project Status

**Last updated:** 2026-07-05 (v1.0.1 maintenance cleanup)  
**Current production release:** v1.0.0  
**Maintenance branch:** `release/v1.0.1-maintenance`  
**Scope:** Repository cleanup only; no new business features.

---

## Summary

WILMS v1.0.0 is the historical production release. The v1.0.1 maintenance branch focuses on repository hygiene: archiving RC evidence, reducing root clutter, removing proven dead code, applying non-breaking dependency fixes, updating current documentation, and preserving full reproducibility.

---

## Production Baseline

| Area | Status |
|------|--------|
| Frontend | Vercel production: https://wilms.vercel.app |
| API | Railway production: https://wilms-production.up.railway.app |
| Database | Neon PostgreSQL, 13/13 migrations at v1.0.0 baseline |
| Uploads | Cloudinary in production |
| Historical evidence | Archived under `docs/archive/` |

---

## v1.0.1 Maintenance Work

| Area | Status |
|------|--------|
| Documentation archive | In progress - root RC reports and `docs/page-validation` moved to `docs/archive/` |
| Source cleanup | In progress - removed unused `AppLockRequiredGate` |
| Script cleanup | In progress - generated verification outputs redirected to `docs/generated/` |
| Dependency cleanup | In progress - non-breaking `npm audit fix` applied; breaking CVE upgrades documented |
| CI/CD cleanup | Audited; workflows retained |
| Environment cleanup | In progress - `.env.example` and docs aligned to current production variables |
| Verification | Pending full run after cleanup commits |

---

## Required Verification Before PR

```bash
npm install
npm run type-check
npm run lint
npm run build
npm test
npm run db:migrate -w @wilms/api
npm run verify:api-integrity
npm run verify:api-coverage
npm run verify:mock-guard
npm run smoke:production
npm run smoke:rbac
```

---

## Current Blockers

- Remaining dependency advisories require breaking upgrades (`next`, `drizzle-orm`, Playwright, ExcelJS/uuid transitive chain).
- Production smoke may still report a git SHA mismatch when local expected SHA differs from Railway platform metadata.
- Some mock/demo data remains in test/dev and reference-seed paths; production mock guard remains required.