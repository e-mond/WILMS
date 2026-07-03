# WILMS — Project Status

**Last updated:** 2026-07-03  
**Current release:** v0.2.2  
**Active phase:** RC1.4 — final production verification & v1.0 certification  
**Branch:** `release/rc1-4-v1-certification`

---

## Executive summary

RC1.3.3 backend recovery is complete (schema repaired, smoke 29/29, RBAC 11/11). RC1.4 focuses on deployment synchronization, UX completion, registration/capture hardening, and v1.0 certification — not a feature sprint.

---

## RC1.4 progress

| Phase | Status |
|-------|--------|
| 1 — Deployment sync | In progress (`verify:deploy-sync`, smoke gitCommit gates) |
| 2–17 | Pending |

Evidence: `docs/page-validation/RC1.4-*.md`

---

## Quick verification

```bash
npm run verify:deploy-sync    # WILMS_API_URL + optional EXPECTED_GIT_COMMIT
npm run smoke:production      # expect 31/31 with gitCommit + schema gates
npm run smoke:rbac            # expect 11/11
curl -s $WILMS_API_URL/health | jq '.data | {gitCommit, schema, runtime}'
```
