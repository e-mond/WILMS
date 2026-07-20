# Final Dependency Audit — WILMS v1.4.1

**Date:** 2026-07-20  
**Monorepo:** npm workspaces + Turborepo  
**Engines:** `node >=22` (root `package.json`)

---

## Runtime alignment (Verified)

| Surface | Version | Status |
|---------|---------|--------|
| Root engines | `>=22` | **Verified** |
| CI (`ci.yml`) | Node 22 | **Verified** |
| Deploy staging / production | Node 22 (fixed from 20 in this branch) | **Verified** |
| App versions | `1.4.1` root + apps | **Verified** via package.json |

---

## Dependency posture

| Check | Status |
|-------|--------|
| Install method (Cloud / CI) | `npm ci` from repo root |
| Frontend stack | Next.js 14 workspace |
| Backend stack | Express + Drizzle |
| Shared packages | `packages/shared-*` |
| Fresh `npm audit` triage in this pack | **Pending operator** — do not invent CVE counts |
| License scan | **Not verified** in this pack |

Prior UX pack dependency delta: [`../ux-modernisation/DEPENDENCY_REPORT.md`](../ux-modernisation/DEPENDENCY_REPORT.md).

---

## Operational dependencies (environment)

| Dependency | Required for prod? | Notes |
|------------|--------------------|-------|
| PostgreSQL (`DATABASE_URL`) | Yes | In-memory is not production |
| Redis (`REDIS_URL`) | Recommended | Degrades to in-process without it |
| Cloudinary / Gmail / SMS | Feature-dependent | Health integrations surface |
| Vercel / Railway (or equiv.) | Deploy targets | Per ops config |

---

## Recommendation

1. Run `npm audit` (and org policy scanner) on the release commit; triage **high+**.  
2. Keep Node 22 everywhere — reject any workflow regression to 20.  
3. Pin CI to the same major as `engines`.

Controlled rollout is **not** blocked solely by absence of a printed CVE table, provided operators complete audit triage before broad exposure.
