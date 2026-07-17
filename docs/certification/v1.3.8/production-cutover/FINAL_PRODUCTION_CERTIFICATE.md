# Final Production Certificate — WILMS v1.3.8

**Document type:** Production certification certificate  
**Version:** 1.3.8  
**Date:** 17 July 2026  
**Phase:** 23 — Production Cutover  
**Issuing authority:** Release Manager / SRE (documentation)

---

## Certificate status

# NOT ISSUED

Conditions remain open. This document records **cutover posture**, not a issued production certificate.

---

## Product

| Field | Value |
|-------|-------|
| System | WILMS — Women's Interest-Free Loan Management System |
| Version | **1.3.8** |
| Production API | `https://wilms-production.up.railway.app` |
| Production frontend | `https://wilms.vercel.app` |
| Deployed commit | `866d72ed0fb417f9dd05d87956a9c564a80f9c85` |
| Deployed at | `2026-07-17T19:12:38.100Z` |
| Certified tag | **NOT CREATED** — `v1.3.8-production-certified` does not exist |
| Maintenance branch | **NOT CREATED** |

---

## Readiness tracks

| Track | Status | Basis |
|-------|--------|-------|
| **Software track** | **CLOSED** | Phases 21–22 product acceptance and go-live closure; local gates; public prod health at v1.3.8 |
| **Operator track** | **OPEN** | Authenticated smoke, Neon restore, financial DB reconcile, metrics/alerts, human sign-offs |

**Do not conflate tracks.** Software closure does not issue the production certificate.

---

## Cutover decision

# ⚠ READY WITH CONDITIONS

WILMS v1.3.8 **is deployed and operable** at the public layer. Continued production operation is **authorized subject to operator closure**.

**Production Certified status is withheld** until all Pending items in [PRODUCTION_ACCEPTANCE_CHECKLIST.md](./PRODUCTION_ACCEPTANCE_CHECKLIST.md) are closed with real evidence.

---

## Evidence summary (Phase 23 session `20260717T193511Z`)

### Complete (this session)

| Evidence | Result |
|----------|--------|
| `GET /health` | 200 — `version: 1.3.8`, `status: ok`, DB connected |
| `gitCommit` | `866d72ed0fb417f9dd05d87956a9c564a80f9c85` |
| Integrations | Cloudinary valid; Gmail configured; smsnotifygh configured |
| Workers | `redis: not_used`, `queue: in_process`, `scheduler: http_triggered` |
| Migration watermark | `0027` (`latestJournalWhen: 1784296800000`) |
| Frontend version | `/login` contains `1.3.8` |
| Security | HSTS, CSP, CORS→wilms.vercel.app, `X-Request-Id` |
| Anon `/ops/metrics` | 401 |
| CSRF | 200 |
| `/ops` | 307 auth redirect |

Artifacts: `evidence/` directory under this pack.

### Accepted (not blockers)

| Item | Rationale |
|------|-----------|
| Migration `countGap: true` (27 vs 28 rows) | Historical gap; `migrations.status: ok`; watermark at `0027` |
| In-process queue / no Redis | Documented v1.3.8 residual |

### Pending (blocks certificate issuance)

| Item | Reason |
|------|--------|
| Authenticated prod money-chain smoke | `WILMS_SMOKE_*` **UNSET** |
| RBAC prod smoke (all roles) | No role credentials |
| Live financial DB reconcile | `DATABASE_URL` **UNSET** |
| Neon backup / restore / PITR drill | No Neon console/API access |
| `/ops/metrics` with token | `WILMS_METRICS_TOKEN` **UNSET** |
| Alert delivery verification | Not executed |
| Human signatures | Not collected — cannot fabricate |

---

## Certified scope (when issued)

**Intended for:** Operational deployment as a women's interest-free loan management system — staff portals, field collections, audit trail, RBAC, financial reconciliation within WILMS source-of-truth rules.

**Not certified for:**

- Double-entry statutory general ledger
- Banking core / regulated deposit-taking
- Enterprise acquisition grade without further evidence
- Load-proven scale without staging stress results

---

## Path to ✅ WILMS v1.3.8 Production Certified

1. Complete every **Pending** row in [PRODUCTION_ACCEPTANCE_CHECKLIST.md](./PRODUCTION_ACCEPTANCE_CHECKLIST.md) with timestamped evidence on disk.
2. Collect human signatures in [RELEASE_APPROVAL_RECORD.md](./RELEASE_APPROVAL_RECORD.md) and domain sign-off documents.
3. Update this certificate:
   - **Certificate status:** **ISSUED**
   - **Cutover decision:** **✅ WILMS v1.3.8 Production Certified**
4. Execute [MAINTENANCE_BRANCH_PLAN.md](./MAINTENANCE_BRANCH_PLAN.md):
   - Create annotated tag `v1.3.8-production-certified`
   - Create maintenance branch
   - **Only after** steps 1–3 are complete

---

## Certification statement (conditional — not issued)

> **WILMS v1.3.8 software readiness is CLOSED (Phases 21–22). Operator readiness is OPEN.**
>
> **The production certificate is NOT ISSUED. Cutover posture is ⚠ READY WITH CONDITIONS.**
>
> **Do not describe WILMS as "Production Certified" to external stakeholders until this certificate status is ISSUED with attached evidence and signatures.**

**Formal signatures:** **Pending**

| Role | Name | Date |
|------|------|------|
| Release Manager | — | — |
| Engineering Lead | — | — |
| CTO | — | — |

---

## Upstream certification chain

| Phase | Verdict | Path |
|-------|---------|------|
| 21 Product acceptance | Ready with Conditions | `product-acceptance/FINAL_PRODUCT_CERTIFICATION.md` |
| 22 Go-live closure | ⚠ READY WITH CONDITIONS | `go-live/FINAL_CERTIFICATION_DECISION.md` |
| **23 Production cutover** | **⚠ READY WITH CONDITIONS** | This document |
