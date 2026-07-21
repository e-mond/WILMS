# WILMS Final Audit Index — v1.4.1

**Date:** 2026-07-21  
**Version:** 1.4.1  
**Verdict:** **READY WITH CONDITIONS** — controlled rollout candidate  
**Production Certified:** **NOT ISSUED**

---

## Phase 26 closure pack (current)

Primary pack: [`certification/v1.4/phase-26/`](./certification/v1.4/phase-26/)

| Doc | Path |
|-----|------|
| Final system audit | [FINAL_SYSTEM_AUDIT.md](./certification/v1.4/phase-26/FINAL_SYSTEM_AUDIT.md) |
| Production readiness | [FINAL_PRODUCTION_READINESS.md](./certification/v1.4/phase-26/FINAL_PRODUCTION_READINESS.md) |
| Findings matrix | [FINDINGS_MATRIX.md](./certification/v1.4/phase-26/FINDINGS_MATRIX.md) |
| Manual actions | [MANUAL_ACTIONS_REQUIRED.md](./certification/v1.4/phase-26/MANUAL_ACTIONS_REQUIRED.md) |
| Security | [SECURITY_AUDIT.md](./certification/v1.4/phase-26/SECURITY_AUDIT.md) |
| Financial engine | [FINANCIAL_ENGINE_AUDIT.md](./certification/v1.4/phase-26/FINANCIAL_ENGINE_AUDIT.md) |
| RBAC / IDOR | [RBAC_IDOR_AUDIT.md](./certification/v1.4/phase-26/RBAC_IDOR_AUDIT.md) |
| Performance | [PERFORMANCE_AUDIT.md](./certification/v1.4/phase-26/PERFORMANCE_AUDIT.md) |
| Database | [DATABASE_AUDIT.md](./certification/v1.4/phase-26/DATABASE_AUDIT.md) |
| UX / UI | [UX_UI_AUDIT.md](./certification/v1.4/phase-26/UX_UI_AUDIT.md) |
| Accessibility | [ACCESSIBILITY_REPORT.md](./certification/v1.4/phase-26/ACCESSIBILITY_REPORT.md) |
| Dependencies | [DEPENDENCY_REPORT.md](./certification/v1.4/phase-26/DEPENDENCY_REPORT.md) |
| Technical debt | [TECHNICAL_DEBT_REPORT.md](./certification/v1.4/phase-26/TECHNICAL_DEBT_REPORT.md) |
| Production gaps | [PRODUCTION_GAP_REPORT.md](./certification/v1.4/phase-26/PRODUCTION_GAP_REPORT.md) |
| Documentation audit | [DOCUMENTATION_AUDIT.md](./certification/v1.4/phase-26/DOCUMENTATION_AUDIT.md) |

Phase 26 closes invite expiry, adjustment/loan SoD, upload magic bytes, password policy 10+, LOAN_CREATE idempotency, payment-by-id, and pool refresh on adjustment approve. Residual Mediums and operator gates remain — **Production Certified NOT ISSUED**.

---

## Prior: final-system-audit (PR #137 baseline)

Pack: [`certification/v1.4/final-system-audit/`](./certification/v1.4/final-system-audit/)

| Doc | Path |
|-----|------|
| Full-system audit (10-point summary) | [FINAL_FULL_SYSTEM_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_FULL_SYSTEM_AUDIT.md) |
| Release decision | [FINAL_RELEASE_DECISION.md](./certification/v1.4/final-system-audit/FINAL_RELEASE_DECISION.md) |
| Manual actions | [FINAL_MANUAL_ACTIONS_REQUIRED.md](./certification/v1.4/final-system-audit/FINAL_MANUAL_ACTIONS_REQUIRED.md) |
| Production readiness | [FINAL_PRODUCTION_READINESS.md](./certification/v1.4/final-system-audit/FINAL_PRODUCTION_READINESS.md) |

### Domain audits (final-system-audit)

| Domain | Path |
|--------|------|
| Code | [FINAL_CODE_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_CODE_AUDIT.md) |
| Security | [FINAL_SECURITY_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_SECURITY_AUDIT.md) |
| Financial integrity | [FINAL_FINANCIAL_INTEGRITY_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_FINANCIAL_INTEGRITY_AUDIT.md) |
| Database | [FINAL_DATABASE_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_DATABASE_AUDIT.md) |
| Performance | [FINAL_PERFORMANCE_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_PERFORMANCE_AUDIT.md) |
| Accessibility | [FINAL_ACCESSIBILITY_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_ACCESSIBILITY_AUDIT.md) |
| UI / UX | [FINAL_UI_UX_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_UI_UX_AUDIT.md) |
| Error handling | [FINAL_ERROR_HANDLING_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_ERROR_HANDLING_AUDIT.md) |
| Dependencies | [FINAL_DEPENDENCY_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_DEPENDENCY_AUDIT.md) |
| Documentation | [FINAL_DOCUMENTATION_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_DOCUMENTATION_AUDIT.md) |
| Dead code | [FINAL_DEAD_CODE_AUDIT.md](./certification/v1.4/final-system-audit/FINAL_DEAD_CODE_AUDIT.md) |

---

## Operational references (docs root)

| Topic | Path |
|-------|------|
| Production rollout runbook | [PRODUCTION_ROLLOUT_RUNBOOK.md](./PRODUCTION_ROLLOUT_RUNBOOK.md) |
| Troubleshooting | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| Architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Financial model | [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md) |
| Permissions and roles | [PERMISSIONS_AND_ROLES.md](./PERMISSIONS_AND_ROLES.md) |

---

## Related packs

- UX modernisation: [`certification/v1.4/ux-modernisation/FULL_AUDIT_INDEX.md`](./certification/v1.4/ux-modernisation/FULL_AUDIT_INDEX.md)  
- Phase 25: [`certification/v1.4/phase-25/INDEX.md`](./certification/v1.4/phase-25/INDEX.md)  
- Documentation hub: [`README.md`](./README.md)

**Merged to main before Phase 26 branch:** PR #132 (UX modernisation), #136 (login INP / mobile sidebar), #137 (final-system-audit hardening).
