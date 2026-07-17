# Final Release Approval — WILMS v1.3.8

**Date:** 17 July 2026  
**Release:** v1.3.8  
**Phase:** 22 — Final Go-Live Closure  
**Decision:** **⚠ READY WITH CONDITIONS**

---

## Release identification

| Field | Value |
|-------|-------|
| Version | `1.3.8` |
| API production URL | `https://wilms-production.up.railway.app` |
| Frontend production URL | `https://wilms.vercel.app` |
| Production `gitCommit` | `43c1a87aa223c32daab683b983b4b33ba86d301e` |
| API deployed at | `2026-07-17T16:50:39.358Z` (from `/health`) |
| Journal last tag | `0027_hot_query_indexes` |

---

## Approval gates

| Gate | Evidence | Status |
|------|----------|--------|
| Local type-check | `evidence/local-gates.txt` | **PASS** |
| Local targeted API tests (36/36) | `evidence/local-gates.txt` | **PASS** |
| Version consistency 1.3.8 | `evidence/local-gates.txt` | **PASS** |
| Bundle budgets | `evidence/local-gates.txt` | **PASS** |
| Migration journal integrity | `evidence/local-gates.txt` | **PASS** |
| Production `/health` ok | `evidence/prod-health-20260717T170225Z.json` | **PASS** |
| Production version 1.3.8 | Health + frontend login probe | **PASS** |
| Migration watermark `0027` | Health `latestJournalWhen` | **PASS** |
| Authenticated prod smoke | — | **Pending** |
| Backup / restore drill | — | **Pending** |
| Security signoff | [SECURITY_SIGNOFF.md](./SECURITY_SIGNOFF.md) | **Pending** |
| Operations signoff | [OPERATIONS_SIGNOFF.md](./OPERATIONS_SIGNOFF.md) | **Pending** |

---

## Dual-track readiness

### 1. Software readiness — **CLOSED**

Release Manager assessment: **Approved for operational use** under documented conditions.

Rationale:

- No unresolved **Critical** software defects identified in Phase 22.
- Automated money-chain and security suites passed locally (36/36).
- Production API reports `status: ok`, schema ok, integrations configured.
- Frontend serves v1.3.8; CSRF path operational.
- Public security headers and anonymous auth enforcement verified.

### 2. Operator readiness — **OPEN**

The following conditions must be closed with **attached evidence** before full production certification:

| # | Condition | Owner | Status |
|---|-----------|-------|--------|
| C1 | Authenticated money-chain smoke (`WILMS_SMOKE_*`) | QA / Ops | **Pending** |
| C2 | RBAC smoke all roles | QA | **Pending** |
| C3 | `/ops/metrics` token + scrape | SRE | **Pending** |
| C4 | Neon PITR + restore drill + RTO | DBA / SRE | **Pending** |
| C5 | Formal sign-offs (this document) | Release / Security / Ops | **Pending** |

Checklist: [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md)

---

## Release scope statement

**Approved scope:** WILMS v1.3.8 as an **interest-free field lending and collections platform** for configured staff roles.

**Not approved to claim:**

- Statutory general ledger / core banking replacement
- Fortune-500 acquisition readiness
- 100k+ row or high-concurrency scale without load test evidence

---

## Residual risks (accepted for this release)

| Risk | Mitigation / timeline |
|------|------------------------|
| In-process queue | v1.4 durable workers |
| No mandatory Idempotency-Key | v1.4 |
| HTTP-triggered scheduler | External cron dependency documented |
| Migration row-count gap (27/28) | Watermark current; monitor only |

---

## Approval signatures

| Role | Name | Date | Decision | Signature |
|------|------|------|----------|-----------|
| Release Manager | — | — | ⚠ READY WITH CONDITIONS | **Pending** |
| Engineering Lead | — | — | Software CLOSED | **Pending** |
| Security Owner | — | — | — | **Pending** |
| Operations Owner | — | — | — | **Pending** |
| Product Owner | — | — | — | **Pending** |

---

## Path to ✅ READY FOR PRODUCTION

1. Complete every **Pending** row in [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md).
2. Attach evidence files under `evidence/` (or linked CI artifacts).
3. Fill signature block above.
4. Update [FINAL_CERTIFICATION_DECISION.md](./FINAL_CERTIFICATION_DECISION.md) to **✅ READY FOR PRODUCTION**.

---

## Related documents

- [FINAL_GO_LIVE_REPORT.md](./FINAL_GO_LIVE_REPORT.md)
- [FINAL_CERTIFICATION_DECISION.md](./FINAL_CERTIFICATION_DECISION.md)
- [INDEX.md](./INDEX.md)
