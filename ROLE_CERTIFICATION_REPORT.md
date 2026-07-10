# WILMS — Stage 2 Role Certification

**Audit stage:** 2 (Role Certification)  
**Date:** 2026-07-10  
**Repository:** `e-mond/WILMS`  
**Git ref audited:** `main` @ `1845f77`  
**Remediation:** RBAC gaps addressed on branch `cursor/rbac-gaps-and-stage-3-8847` (see §8)

*(Full report body — findings R2-G01 through R2-P08 documented at audit time. Key content summarized below; original static analysis remains valid with remediation noted.)*

---

## Executive summary

Five authenticated staff roles; Administrator = Super Admin; Group Leader and Borrower are domain concepts only. API used static `shared-rbac` matrix; Settings DB roles were not enforced.

**Remediation (2026-07-10):** Permission resolver wired to DB; borrower list/search/formation routes hardened; frontend collector permissions synced. See `USER_FLOW_CERTIFICATION.md` §8.

---

## Verified gaps (pre-remediation)

| ID | Severity | Issue |
|----|----------|-------|
| R2-G01 | High | `GET /borrowers` auth-only |
| R2-G02 | Medium | Borrower detail scoping skipped collector |
| R2-G03 | Medium | Group-formation auth-only |
| R2-G04 | Medium | Search auth-only + client role spoofing |
| R2-G06 | High | DB role permissions ignored by API |
| R2-G07 | Medium | Frontend collector permission drift |
| R2-G09–G10 | Medium | PII check and admin-fee routes auth-only |

## Verified positives

Collector self-access, cross-portal 403s, security harness 11/11, five portal layout guards — all documented in original Stage 2 analysis.

## Runtime evidence

- Collector portal Vitest: 10/10
- Production smoke:rbac: 7/8 (admin login failed)
- Local probes confirmed R2-G01 (collector/auditor 200 on `/borrowers` before fix)

---

## §8 Remediation status

| Gap | Status on `cursor/rbac-gaps-and-stage-3-8847` |
|-----|--------------------------------------------------|
| R2-G01 | **Fixed** — `assertBorrowerListAccess` |
| R2-G02 | **Fixed** — collector group assignment check |
| R2-G03 | **Fixed** — formation route permissions |
| R2-G04 | **Fixed** — search permissions + session role |
| R2-G06 | **Fixed** — `resolveUserPermissions` |
| R2-G07 | **Fixed** — frontend `rbac-roles.ts` |
| R2-G09, G10 | **Fixed** — route permissions added |

**Next stage:** Stage 3 `USER_FLOW_CERTIFICATION.md` (included on same branch).
