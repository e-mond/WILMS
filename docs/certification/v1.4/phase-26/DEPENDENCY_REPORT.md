# Dependency Report — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Engines:** `node >= 22`  
**App version:** **1.4.1** (root + apps — `verify:version` PASS)

---

## Audit snapshot (Verified this pack)

```
npm audit --production
10 vulnerabilities (1 low, 4 moderate, 5 high)
0 critical
```

**Residual — do not claim fixed.** Triage is an operator/engineering follow-up before broad exposure.

Notable advisory classes observed (production audit tree): Next.js / postcss chain, Playwright SSL verify (high), uuid via exceljs (moderate). Force-fixes may require breaking major bumps — do not auto-`npm audit fix --force` on release without regression plan.

---

## Runtime alignment (Verified)

| Surface | Status |
|---------|--------|
| Root / FE / API package version `1.4.1` | PASS |
| CI / deploy Node 22 | Present (final-system-audit / Phase 25) |
| Install | `npm ci` from monorepo root |

---

## Operational dependencies

| Dependency | Prod required? | Notes |
|------------|----------------|-------|
| PostgreSQL (`DATABASE_URL`) | Yes | In-memory ≠ production |
| Redis (`REDIS_URL`) | Recommended | In-process fallback otherwise |
| Cloudinary / mail / SMS | Feature-dependent | |
| Vercel / Railway (or equiv.) | Deploy targets | Per ops |

---

## Recommendations

1. Triage **high** CVEs on the release commit; schedule non-breaking upgrades first.  
2. Keep Node 22; reject workflow regressions to 20.  
3. Re-run `npm audit --production` after any lockfile change.

**Cross-link:** [PRODUCTION_GAP_REPORT.md](./PRODUCTION_GAP_REPORT.md) — infrastructure / operator blockers.
