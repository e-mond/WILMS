# WILMS — Project Status

**Last updated:** 2026-07-04  
**Current release:** v0.2.2  
**Active phase:** RC1.4 — final production verification & v1.0 certification  
**Branch:** `release/rc1-4-v1-certification`

---

## Executive summary

RC1.3.3 recovery complete (schema repaired, smoke 31/31, RBAC 11/11). RC1.4 adds deploy sync verification, registration draft persistence, mobile photo capture, real guarantor validation, readable USR/TXN IDs, floating connection status, and certification deliverables.

---

## Phased rollout (2026-07-04)

| PR | Delivered |
|----|-----------|
| CI hotfix | Audit log test uses `TestAppProviders`; permissive `usePermission` fallback |
| Readable IDs | Shared `formatBorrowerDisplayId`; settings/audit/payment display IDs |
| Ghana locations | DB schema `0012`, bundled seeds, import script, async location API |
| Unified export | `WilmsExportModal` + Word engine; single Export button on report pages |
| App lock | Background idle lock; `pinConfigured` state; engineering doc |
| Notifications | Missed-payment + approval SMS wired; smoke script |
| Collector QA | 20s API timeout; collector settings trimmed to functional sections |

Engineering docs: `docs/engineering/ghana-locations.md`, `docs/engineering/app-lock.md`

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
