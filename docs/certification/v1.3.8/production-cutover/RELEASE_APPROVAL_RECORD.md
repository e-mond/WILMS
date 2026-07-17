# Release Approval Record — WILMS v1.3.8 Production Cutover

**Date:** 17 July 2026  
**Phase:** 23  
**Release candidate:** v1.3.8  
**Production commit:** `866d72ed0fb417f9dd05d87956a9c564a80f9c85`  
**Cutover decision:** **⚠ READY WITH CONDITIONS**

---

## Release summary

| Item | Value |
|------|-------|
| Version | **1.3.8** |
| API deploy | Railway — `wilms-production.up.railway.app` |
| Frontend deploy | Vercel — `wilms.vercel.app` |
| Deployed at | `2026-07-17T19:12:38.100Z` |
| Build ID | `14bae007-c667-41b9-b59a-59784dd1b75f` |
| Certification tag | **NOT CREATED** (`v1.3.8-production-certified`) |
| Maintenance branch | **NOT CREATED** |

---

## Approval gates

| Gate | Status | Evidence |
|------|--------|----------|
| Software track (Phases 21–22) | **CLOSED** | Upstream packs |
| Production deploy sync | **Complete** | `evidence/prod-health-20260717T193511Z.json` |
| Public health / integrations | **Complete** | Health JSON + probes CSV |
| Security headers / anon auth | **Complete** | Header evidence |
| Authenticated smoke | **Pending** | `evidence/smoke-no-creds-*.log` |
| Financial live reconcile | **Pending** | `DATABASE_URL` unset |
| Backup / restore drill | **Pending** | No Neon evidence |
| Monitoring / alerts | **Pending** | No scrape or alert logs |
| Production certificate | **NOT ISSUED** | [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md) |

---

## Stakeholder sign-off

**Rule:** Sign only after attached evidence exists for the stakeholder's domain. **Do not sign on aspiration.**

| Role | Name | Date | Decision | Status |
|------|------|------|----------|--------|
| Release Manager | — | — | — | **Pending** |
| Engineering Lead | — | — | — | **Pending** |
| CTO | — | — | — | **Pending** |
| Operations Owner | — | — | — | **Pending** |
| Finance | — | — | — | **Pending** |
| Security Owner | — | — | — | **Pending** |
| Product Owner | — | — | — | **Pending** |
| Support Lead | — | — | — | **Pending** |
| QA Lead | — | — | — | **Pending** |

---

## Release Manager decision (documentation only)

| Field | Value |
|-------|-------|
| Decision | **⚠ READY WITH CONDITIONS** |
| Software track | **CLOSED** |
| Operator track | **OPEN** |
| Certificate | **NOT ISSUED** |
| Authorized for continued production operation | **Yes** — subject to operator closure |
| Authorized to declare Production Certified | **No** — pending checklist |

**Signed:** Release Manager / SRE (Phase 23 documentation session) — **not a formal human signature**

---

## Conditions for full release approval

1. Complete [PRODUCTION_ACCEPTANCE_CHECKLIST.md](./PRODUCTION_ACCEPTANCE_CHECKLIST.md) — all **Pending** → **Complete** with evidence.
2. Fill all stakeholder rows above with name and date.
3. Issue [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md).
4. Execute [MAINTENANCE_BRANCH_PLAN.md](./MAINTENANCE_BRANCH_PLAN.md) **only after** ✅ certification.

---

## Related documents

- [PRODUCTION_CUTOVER_REPORT.md](./PRODUCTION_CUTOVER_REPORT.md)
- [SECURITY_OPERATIONAL_SIGNOFF.md](./SECURITY_OPERATIONAL_SIGNOFF.md)
- [OPERATIONS_SIGNOFF.md](./OPERATIONS_SIGNOFF.md)
- [FINAL_PRODUCTION_CERTIFICATE.md](./FINAL_PRODUCTION_CERTIFICATE.md)
