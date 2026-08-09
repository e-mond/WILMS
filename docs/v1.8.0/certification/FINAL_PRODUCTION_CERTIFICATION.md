# WILMS v1.8.0 — Final Production Certification Report

**Product:** Women’s Interest-Free Loan Management System (WILMS)  
**Release identity:** **1.8.0** (no version bump; no v1.8.1)  
**Certification branch:** `fix/v1.8.0-production-certification`  
**Code / deploy SHA:** `73e5b65d6a509b5c64f08f18e7266b59c72c0860`  
**Report date (UTC):** 2026-08-09  
**Pack location:** `docs/v1.8.0/certification/`

---

## Executive summary

This sprint performed an **evidence-based** production certification attempt against live `https://wilms.vercel.app` and the local engineering pipeline on `main` @ `73e5b65` (includes #176 production-readiness + #177 push/alerts/photo-capture).

**Final verdict: READY WITH CONDITIONS — not PRODUCTION CERTIFIED.**

Several mandatory gates from the certification rule remain **BLOCKED** (real browser push delivery, authenticated multi-role / money-chain smoke, WCAG axe run, backup/restore, provider receipt captures, complete fresh build/bundle in this network environment). Local unit/integration strength and production health/SHA parity are strong, but insufficient alone for **PRODUCTION CERTIFIED**.

---

## Sign-off matrix

| Gate | Verdict | Report |
|------|---------|--------|
| Version integrity | PASS WITH NOTES (no `v1.8.0` git tag) | `VERSION_INTEGRITY_REPORT.md` |
| Engineering automation | PASS WITH CONDITIONS (bundle/fresh build) | `ENGINEERING_CERTIFICATION_REPORT.md` |
| Production deployment | PASS (SHA/health) + smoke BLOCKED | `PRODUCTION_DEPLOYMENT_REPORT.md` |
| Push (real device) | **BLOCKED** | `PUSH_NOTIFICATION_CERTIFICATION.md` |
| Notifications (all channels) | PARTIAL / BLOCKED live receipts | `NOTIFICATION_CERTIFICATION_REPORT.md` |
| Financial chain (live) | Unit PASS / live BLOCKED | `FINANCIAL_CHAIN_CERTIFICATION.md` |
| RBAC (interactive) | Unit PASS / UI BLOCKED | `RBAC_CERTIFICATION_REPORT.md` |
| Offline device | Docs+unit / device BLOCKED | `OFFLINE_CERTIFICATION_REPORT.md` |
| Performance lab | **BLOCKED** | `PERFORMANCE_CERTIFICATION_REPORT.md` |
| Accessibility WCAG 2.2 AA | **BLOCKED** | `ACCESSIBILITY_CERTIFICATION_REPORT.md` |
| Security | PASS WITH CONDITIONS | `SECURITY_CERTIFICATION_REPORT.md` |
| Disaster recovery | **BLOCKED** | `DISASTER_RECOVERY_CERTIFICATION.md` |
| Operations | PARTIAL | `OPERATIONS_CERTIFICATION_REPORT.md` |
| Documentation | PASS WITH NOTES | `DOCUMENTATION_CERTIFICATION_REPORT.md` |

---

## Engineering summary

- Type-check, lint, domain **250** tests, frontend shards **271** + **269** — PASS (logged).  
- Mock-guard + API integrity — PASS.  
- Fresh `next build` / bundle budget in this agent network — CONDITIONAL (Google Fonts CDN `ECONNRESET`).  
- Axe Playwright — BLOCKED (browsers not installed + font fetch).

## Security summary

Login CSP/HSTS/nosniff evidenced. Demo accounts blocked on live smoke. VAPID endpoint requires auth. CORS responses showed default `http://127.0.0.1:3000` — confirm Production `WILMS_CORS_ORIGIN`. Full interactive auth/CSRF/dependency audit pending.

## Financial summary

Financial integrity P0 + financial RBAC + SoD suites PASS (26 targeted tests). Full production money chain not executed (no smoke credentials; no unsolicited prod mutations).

## Operations summary

Production health `ok`; Cloudinary/mail/SMS configured; scheduler HTTP-triggered. Cron last-run / ops UI not captured. Authenticated smoke BLOCKED without `WILMS_SMOKE_*`.

## Performance / accessibility / DR

All **BLOCKED** for certification purposes pending lab tools, Playwright browsers, and backup URLs.

## Push notification

Operator asserts VAPID configured in Vercel. This certification **did not** observe an OS/browser notification from production. Unauthenticated vapid key probe returned 401. **Cannot PASS push gate.**

---

## Risk register

| ID | Risk | Severity | Mitigation / residual |
|----|------|----------|------------------------|
| R1 | No real push delivery proof | High | Operator browser subscribe + trigger + screenshot |
| R2 | No authenticated prod smoke | High | Provide `WILMS_SMOKE_EMAIL`/`PASSWORD` |
| R3 | Missing `v1.8.0` git tag | Medium | Tag `73e5b65` after owner approval |
| R4 | CORS default localhost origin | Medium | Set `WILMS_CORS_ORIGIN` for Production API |
| R5 | Build depends on Google Fonts CDN at compile | Medium | Ensure CI/cache or vendor fonts offline |
| R6 | DR drill skipped | High for cert claim | Run `backup-restore-drill.mjs` with URLs |
| R7 | A11y e2e not green | Medium | Install Playwright; re-run axe |

---

## Unresolved blockers (exact requirements)

1. **Push:** Authenticated browser on production receives a real push; store screenshot + payload + timestamp.  
2. **Smoke:** `WILMS_SMOKE_EMAIL` + `WILMS_SMOKE_PASSWORD` for `npm run smoke:production`.  
3. **A11y:** Playwright browsers installed; axe suite green.  
4. **DR:** `WILMS_BACKUP_DATABASE_URL` + `WILMS_RESTORE_DATABASE_URL` drill PASS.  
5. **Perf:** Lighthouse/Web Vitals artefacts for key routes.  
6. **Money chain / RBAC UI:** Controlled staging or approved production walkthrough with screenshots.  
7. **Build/bundle:** Successful rebuild with font CDN or cache; `bundle:budget-check` PASS.  
8. **Optional:** Create annotated git tag `v1.8.0` → `73e5b65` (owner decision; this sprint does not retag).

---

## Evidence index

| Artefact | Path |
|----------|------|
| Health JSON / headers | `evidence/health.json`, `health-headers.txt`, `login-headers.txt` |
| VAPID 401 | `evidence/vapid-*.json/txt` |
| Smoke failure | `evidence/smoke-production.log` |
| Pipeline exits | `evidence/pipeline-start.txt` |
| Domain / FE tests | `evidence/domain-tests.log`, `frontend-shard*.log` |
| Financial/RBAC/SoD | `evidence/financial-rbac-sod.log` |
| A11y failure | `evidence/a11y-e2e.log` |
| Bundle failure | `evidence/bundle-budget*.log` |
| DR skip | `evidence/backup-restore-drill-*.json` (copied when available) |

---

## Explicit certification statement

**WILMS v1.8.0 is not PRODUCTION CERTIFIED by this pack.**

**Verdict: READY WITH CONDITIONS.**

No production certification should be claimed until every required operational gate has **real** evidence as listed above. Local CI and health SHA parity alone are insufficient under the certification rule.

---

## PDF note

- Authoritative narrative: `WILMS_v1.8.0_PRODUCTION_CERTIFICATION_REPORT.md` (identical to `FINAL_PRODUCTION_CERTIFICATION.md`).
- `WILMS_v1.8.0_PRODUCTION_CERTIFICATION_REPORT.pdf` is a **cover sheet** generated locally (full `md-to-pdf` Chromium render **BLOCKED** in this environment — see `evidence/pdf-generation-blocked.txt`).
