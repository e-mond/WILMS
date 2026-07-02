# WILMS — Project Status

**Last updated:** 2026-07-02  
**Current release:** v0.2.2  
**Active phase:** RC1.3.3 — release synchronization & production recovery on `main`

---

## Executive summary

RC1.3 merged into `main`. Recovery work adds schema health probes, empty-database list verification, null-safe repository mappers, and Railway/Vercel git SHA fallbacks. **Production smoke still 17/29** until Railway/Vercel redeploy from merged `main` and empty-DB API fixes are confirmed live.

**Next:** Redeploy both surfaces from same commit → `verify:empty-db` on production DB → smoke 29/29 + RBAC 11/11.

---

## RC1.3.3 recovery (in progress)

| Item | Status |
|------|--------|
| RC1.3 merged to `main` | In progress |
| Schema health in `/health` | Implemented |
| `verify:empty-db` script | Implemented |
| Repository null-safe mappers | Implemented |
| Production smoke 29/29 | **Pending redeploy** |
| RBAC smoke 11/11 | **Pending redeploy** |

Evidence: `docs/page-validation/RC1.3.3-*.md`

---

## Quick verification

```bash
npm run verify:empty-db       # empty DB list handlers (needs DATABASE_URL)
npm run smoke:production      # expect 29/29 after redeploy
npm run smoke:rbac            # expect 11/11 after redeploy
curl -s https://wilms-production.up.railway.app/health | jq '.data | {gitCommit, schema}'
```
