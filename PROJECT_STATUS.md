# WILMS — Project Status

**Last updated:** 2026-07-04  
**Current release:** v0.2.2  
**Active phase:** RC1.4 — final production verification & v1.0 certification  
**Branch:** `release/rc1-4-v1-certification`

---

## Executive summary

RC1.3.3 recovery complete (schema repaired, smoke 31/31, RBAC 11/11). RC1.4 adds deploy sync verification, registration draft persistence, mobile photo capture, real guarantor validation, readable USR/TXN IDs, floating connection status, and certification deliverables.

---

## RC1.4 progress

| Phase | Status |
|-------|--------|
| 1 — Deployment sync | Code complete; Railway env cleanup pending |
| 3 — Registration drafts | Implemented |
| 4 — Photo capture | Implemented |
| 5 — Guarantor validation | Implemented |
| 6–13 — UX polish | Partial (IDs, nav, loan pools; notification sounds hook) |
| 14–17 — Security/docs/cert | Deliverables written; PR pending |

Evidence: `docs/page-validation/RC1.4-*.md`

---

## Quick verification

```bash
npm run verify:deploy-sync
npm run smoke:production
npm run smoke:rbac
npm run test -w @wilms/api
curl -s $WILMS_API_URL/health | jq '.data | {gitCommit, schema, runtime}'
```
