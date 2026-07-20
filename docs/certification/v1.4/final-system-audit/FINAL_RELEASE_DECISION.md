# Final Release Decision — WILMS v1.4.1

**Date:** 2026-07-20  
**Version:** 1.4.1  
**Pack:** [`docs/certification/v1.4/final-system-audit/`](./)

---

## Decision

# READY WITH CONDITIONS

WILMS v1.4.1 is approved as a **controlled operational rollout candidate** after the hardening fixes in this audit branch.

**Production Certified: NOT ISSUED.**

---

## Decision basis

| Factor | Outcome |
|--------|---------|
| Hardening fixes (demo, errors, session, IDOR, reports, FE headers, Node 22) | **Verified** in branch |
| Financial core (admin fee, pool stop, immutability, GPS, reversal, SQL KPIs) | **Conditional pass** |
| Residual Medium security / SoD / scale | Documented; accepted only with operator risk management |
| Live load test | **Not verified** |
| Operator manual actions | **Open** — must complete [FINAL_MANUAL_ACTIONS_REQUIRED.md](./FINAL_MANUAL_ACTIONS_REQUIRED.md) |

---

## Conditions (mandatory)

1. Operators complete FINAL_MANUAL_ACTIONS_REQUIRED before broad go-live.  
2. No marketing or internal stamp of “Production Certified” for this release.  
3. Residual Medium findings remain on the risk register until fixed or formally accepted.  
4. Related UX PR **#136** is tracked separately and not assumed shipped.  
5. Staging remains gated; production deploys follow [PRODUCTION_ROLLOUT_RUNBOOK.md](../../../PRODUCTION_ROLLOUT_RUNBOOK.md).

---

## Alternatives considered (not selected)

| Option | Why not |
|--------|---------|
| READY FOR PRODUCTION / Production Certified | Operator evidence and residuals incomplete |
| NOT READY | Hardening closed critical operational gaps; controlled use is justified |

---

## Authority

This document records the engineering audit recommendation for v1.4.1. Organisational go-live still requires Release Manager / Ops sign-off on the manual actions table.

**Chosen verdict (exact):** READY WITH CONDITIONS
