# Final Product Certification — WILMS v1.3.8

**Document type:** Product Acceptance Certification  
**Phase:** 21  
**Product version:** 1.3.8  
**Code reference:** `main` branch (includes Phase 20 PR #126 — Operations dashboard)  
**Certification date:** 17 July 2026  
**Validity:** Until v1.3.9+ acceptance or material architecture change

---

## 1. Certification statement

Having completed Phase 21 Product Acceptance review against the evidence cited in this pack, the undersigned working group certifies:

> **WILMS version 1.3.8 is ⚠ READY WITH CONDITIONS for operational deployment** to support a women's interest-free loan programme operated entirely by staff (five roles). The product implements the end-to-end money chain with server-authoritative financial reporting, enforced RBAC, immutable audit logging, and production operations documentation suitable for handover.

This certification is **not** an unconditional production go-live approval.

---

## 2. Product boundary (certified scope)

| In scope | Evidence |
|----------|----------|
| Super Admin, Registration Officer, Approver, Collector, Auditor | `packages/shared-rbac`, `demo-users.ts` |
| Borrower **records** (no borrower login) | `modules/borrowers/`, no borrower portal in `apps/frontend/src/app/` |
| Money chain: Registration → … → Audit | [BUSINESS_WORKFLOW_VALIDATION.md](./BUSINESS_WORKFLOW_VALIDATION.md) |
| 32 navigation hrefs → live pages | `navigation.ts`, `apps/frontend/src/app/**/page.tsx` |
| Dashboard & ops financial SoT | `financial-overview.ts`, `dashboardService.ts` |
| Ops dashboard | `/ops`, `modules/ops/` |

| Explicitly excluded from certification |
|----------------------------------------|
| Borrower self-service portal |
| Statutory double-entry general ledger |
| Redis / BullMQ durable queues (v1.4) |
| 100,000+ borrower load proof |
| Full WCAG 2.1 AA re-certification (Phase 21) |
| Productized feature-flag platform |

---

## 3. Acceptance criteria results

| Criterion | Result | Reference |
|-----------|--------|-----------|
| Business workflows executable by staff | ✅ Pass | `BUSINESS_WORKFLOW_VALIDATION.md` |
| Cross-module money propagation | ✅ Pass | `CROSS_MODULE_VALIDATION.md` |
| RBAC matrix matches enforcement | ✅ Pass | `FINAL_RBAC_MATRIX.md` |
| Data / financial integrity | ✅ Pass (conditional) | `DATA_INTEGRITY_REPORT.md` |
| Enterprise UX (staff) | ✅ Pass | `ENTERPRISE_UX_REVIEW.md` |
| Documentation sufficient for handover | ✅ Pass | `DOCUMENTATION_REVIEW.md` |
| Technical debt closed (in-scope) | ✅ Pass | `TECHNICAL_DEBT_CLOSURE.md` |
| Ops handover materials | ✅ Pass | `SYSTEM_HANDOVER_GUIDE.md` |
| Launch scorecard ≥ 80 | ✅ Pass (83) | `LAUNCH_READINESS_SCORECARD.md` |

---

## 4. Test and quality evidence

| Evidence | Result |
|----------|--------|
| `npm run test -w @wilms/api` | 150 tests passed (43 files) |
| `npm run test` (frontend) | Vitest suite — 160+ test files under `apps/frontend/src/tests/` |
| Source debt markers | 0 `TODO`/`FIXME`/`HACK` in `apps/` + `packages/` |
| Production mock guard | `assertProductionMockDisabled()` in `apps/backend/src/index.ts` |

---

## 5. Launch readiness scores (mandated)

| Dimension | Score / 100 |
|-----------|------------:|
| Architecture | 82 |
| Security | 85 |
| Financial Integrity | 88 |
| Performance | 78 |
| Scalability | 62 |
| Reliability | 80 |
| Maintainability | 84 |
| Documentation | 90 |
| UX | 82 |
| Accessibility | 72 |
| Operations | 86 |
| Support | 80 |
| Deployment | 84 |
| **Overall (weighted)** | **≈ 83** |

---

## 6. Conditions (mandatory before unconditional production)

| ID | Condition | Action |
|----|-----------|--------|
| **PA-01** | Migration 0027 | Run `0027_hot_query_indexes.sql` on every environment; verify via `npm run verify:migrations` and `/health` |
| **PA-02** | Staging E2E smoke | Execute authenticated workflow all five roles; archive evidence (logs/screenshots) |
| **PA-03** | Backup restore | Perform Neon PITR restore test; document RTO/RPO in backup log |
| **PA-04** | Limitations ack | Sponsor sign-off on in-process queues, no GL, no borrower portal |
| **PA-05** | Production config | Confirm mock/demo env vars false; integrations configured per `production-guide.md` |

**Status:** PA-01 through PA-05 **open** at certification date.

---

## 7. Path to ✅ Ready for Production (unconditional)

All of the following must be true:

1. Conditions **PA-01 through PA-05** closed with evidence links  
2. `/health` on production API: `database.connected`, `migrations.status: ok`, `schema.status: ok`  
3. On-call roster trained on `INCIDENT_RESPONSE_PLAYBOOK.md` and `ROLLBACK_RUNBOOK.md`  
4. No open Critical defects on launch tracker  
5. Executive summary re-signed: [FINAL_EXECUTIVE_SUMMARY.md](./FINAL_EXECUTIVE_SUMMARY.md)

Optional (recommended, not blocking v1.3.8 conditional cert):

- WCAG accessibility audit  
- Load test plan for projected portfolio size  
- v1.4 queue migration schedule committed  

---

## 8. Certification verdict

| Verdict | Selected |
|---------|----------|
| ❌ Not Ready | |
| **⚠ Ready with Conditions** | **✓ CERTIFIED** |
| ✅ Ready for Production (unconditional) | Pending PA-01–PA-05 |

---

## 9. Sign-off block

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CTO | _________________ | _________________ | ________ |
| QA Director | _________________ | _________________ | ________ |
| Compliance | _________________ | _________________ | ________ |
| Programme Sponsor | _________________ | _________________ | ________ |

---

## 10. Pack index

| Document |
|----------|
| [INDEX.md](./INDEX.md) |
| [PRODUCT_ACCEPTANCE_REPORT.md](./PRODUCT_ACCEPTANCE_REPORT.md) |
| [BUSINESS_WORKFLOW_VALIDATION.md](./BUSINESS_WORKFLOW_VALIDATION.md) |
| [CROSS_MODULE_VALIDATION.md](./CROSS_MODULE_VALIDATION.md) |
| [ENTERPRISE_UX_REVIEW.md](./ENTERPRISE_UX_REVIEW.md) |
| [FINAL_RBAC_MATRIX.md](./FINAL_RBAC_MATRIX.md) |
| [DATA_INTEGRITY_REPORT.md](./DATA_INTEGRITY_REPORT.md) |
| [DOCUMENTATION_REVIEW.md](./DOCUMENTATION_REVIEW.md) |
| [TECHNICAL_DEBT_CLOSURE.md](./TECHNICAL_DEBT_CLOSURE.md) |
| [SYSTEM_HANDOVER_GUIDE.md](./SYSTEM_HANDOVER_GUIDE.md) |
| [LAUNCH_READINESS_SCORECARD.md](./LAUNCH_READINESS_SCORECARD.md) |
| [FINAL_EXECUTIVE_SUMMARY.md](./FINAL_EXECUTIVE_SUMMARY.md) |

---

*This document supersedes informal launch opinions for v1.3.8. Engineering audit detail remains in Phase 17–20 packs under `docs/certification/v1.3.8/`.*
