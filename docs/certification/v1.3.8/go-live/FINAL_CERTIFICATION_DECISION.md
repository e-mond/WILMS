# Final Certification Decision — WILMS v1.3.8

**Date:** 17 July 2026  
**Certification phase:** 22 — Final Go-Live Closure  
**Evidence session:** Agent environment 2026-07-17 + public production probes

---

## Decision

# ⚠ READY WITH CONDITIONS

WILMS v1.3.8 **may continue in production operation** for its intended scope. Full **✅ READY FOR PRODUCTION** certification remains **conditional** on operator closure items.

---

## Readiness split (mandatory)

| Track | Status | Meaning |
|-------|--------|---------|
| **Software readiness** | **CLOSED** | No unresolved Critical software defects found in Phase 22. Product code, local gates, and public production health support operational use. |
| **Operator readiness** | **OPEN** | Authenticated smoke, Neon restore drill evidence, metrics scrape, and formal sign-offs are **Pending**. |

**Do not conflate these tracks.** Software closure does not eliminate operator conditions.

---

## Evidence summary

### Passed (this session)

| Evidence | Result |
|----------|--------|
| `npm run verify:migrations` | Journal 28/28; last `0027_hot_query_indexes`; DB step skipped |
| `npm run type-check` | PASS |
| API unit tests | **150/150 PASS** (43 files); money/security subset 36/36 |
| `npm run verify:version` | PASS 1.3.8 |
| `npm run bundle:budget-check` | PASS 168.4 / 9.4 KB gzip |
| Mock-guard + API integrity | PASS |
| `GET /health` (production) | 200, `version: 1.3.8`, `status: ok`, DB connected, schema ok |
| Migration watermark | `latestJournalWhen: 1784296800000` (= `0027`) |
| Integrations | Cloudinary, Gmail, smsnotifygh configured |
| Frontend `/login` | 200, contains `1.3.8` |
| CSRF | 200 `{"ok":true}` |
| `/ops/metrics` anon | 401 |
| Security headers | HSTS, CSP, X-Content-Type-Options, Referrer-Policy, CORS, X-Request-Id |

Artifacts: `evidence/` directory.

### Accepted (not blockers)

| Item | Rationale |
|------|-----------|
| Migration `countGap: true` (27 vs 28 rows) | Historical gap; `migrations.status: ok`; watermark at `0027` |
| In-process queue / no Redis | Documented v1.3.8 residual; v1.4 track |
| HTTP-triggered scheduler | Documented operational pattern |

### Pending (blocks ✅ upgrade)

| Item | Reason |
|------|--------|
| Authenticated prod money-chain smoke | `WILMS_SMOKE_*` unset |
| RBAC prod smoke | No role credentials |
| `/ops/metrics` with token | `WILMS_METRICS_TOKEN` unset |
| Neon PITR / restore drill | No Neon console / restore log |
| Backup RTO measured | No restore execution |
| Operator signatures | Not on file |

---

## Gate table (authoritative)

| Gate | Status |
|------|--------|
| Journal/SQL integrity (repo) | **PASS** |
| Production migration watermark includes 0027 | **PASS** |
| Migration row-count gap (27 vs 28) | **ACCEPTED** |
| Money-chain automated tests | **PASS** |
| Authenticated staging/prod money-chain smoke | **Pending** |
| Neon PITR / restore drill | **Pending** |
| Public prod health/version/integrations | **PASS** |
| Authenticated RBAC/ops/metrics scrape with token | **Pending** |
| Backup restore RTO measured | **Pending** |
| Operator sign-off signatures | **Pending** |

---

## Product boundary (certified scope)

**Certified for:** Operational deployment as a **women's interest-free loan management system** — staff portals, field collections, audit trail, role-based access, financial reconciliation within WILMS SoT rules.

**Not certified for:**

- Double-entry statutory GL
- Banking core / regulated deposit-taking
- Fortune-500 enterprise acquisition grade
- Proven 100k–1M row or high-concurrency scale

---

## Conditions for ✅ READY FOR PRODUCTION

Complete [OPERATOR_CLOSURE_CHECKLIST.md](./OPERATOR_CLOSURE_CHECKLIST.md) in full. Each item requires **attached evidence** — no self-attestation without artifacts.

Upon closure:

1. Update this document decision to **✅ READY FOR PRODUCTION**.
2. Fill signatures in [FINAL_RELEASE_APPROVAL.md](./FINAL_RELEASE_APPROVAL.md).
3. Archive evidence under `evidence/` with timestamps.

---

## Certification statement

> **We certify WILMS v1.3.8 software as operationally deployable (software readiness CLOSED) subject to operator conditions (operator readiness OPEN).**
>
> **We do not certify WILMS as a best-in-class, acquisition-grade, multi-branch statutory financial platform or as load-proven at enterprise scale.**

**Issued by:** Release Manager / SRE (Phase 22 documentation)  
**Formal signatures:** **Pending**

---

## Upstream certification chain

| Phase | Verdict | Path |
|-------|---------|------|
| 19 RC validation | Conditional PASS | `rc-validation/FINAL_RELEASE_DECISION.md` |
| 21 Product acceptance | Ready with Conditions | `product-acceptance/FINAL_PRODUCT_CERTIFICATION.md` |
| **22 Go-live closure** | **⚠ READY WITH CONDITIONS** | This document |

Phase 22 **confirms production deployment evidence** and **narrows** remaining gaps to operator-executable items.
