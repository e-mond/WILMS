# WILMS Final Offline Recommendation

**Product version:** 1.8.0  
**Phase:** 8 — Final recommendation  
**Language:** British English  
**Branch:** `feature/v1.8.0-offline-first-pwa`  
**Rollback tag:** `v1.8.0-offline-rc1`

## Recommendation

**D. Implement phased offline** (collector-centred), **not** organisation-wide full offline-first.

Closest secondary label: **B. Collector-only offline** for write scope, with read/shell support for other roles only where Safe Cached.

## Options considered

| Option | Meaning | Chosen? |
|--------|---------|---------|
| A. Full offline-first | All modules offline writes | **No** — contradicts Phase 1 Online Only matrix for money-critical paths |
| B. Collector-only offline | Field writes + caches | **Partial** — write scope already collector-centric |
| C. Read-only offline | Shell + snapshots only | **Too weak** alone — payments/expenses/holidays already queue |
| **D. Phased offline** | Flag-gated 3A–3H | **Yes** |
| E. Do not implement offline | Remove/avoid offline | **No** — capability already serves field users; removing would regress |

## Justification (evidence)

1. **Existing production offline writes** are already limited to payments, expenses, holiday creates (`docs/offline-architecture.md`, queue types).  
2. **Phase 1** classifies admin fees, reconciliations, registration sync, pools, disbursements, adjustments, reports, exports, audit as **Online Only**.  
3. **Phase 4–5** introduce a default-off expansion flag and navigate fallback without changing money paths when off.  
4. **Phase 6** automated flag tests pass; **device airplane matrix not executed** — production enablement of the new flag must wait.  
5. **Phase 7** keeps existing payment queue; forbids new financial write types until durability + SoD gates pass.  
6. **Receipt rule:** confirmation notifications only — preserved.

## Immediate next engineering steps

1. Merge this documentation + flag + Phase 5 SW gating.  
2. Complete manual Phase 6 device checklist before any production `WILMS_OFFLINE_MODE=true`.  
3. Execute Phase 3B/3D/3F hardening behind the flag.  
4. Do **not** queue admin fees or recon decisions in the near term.

## Explicit non-claims

This sprint has **not** finished enterprise WhatsApp-style offline-first for all roles.  
It has **documented**, **flag-gated**, and **minimally extended** shell navigation offline support without expanding financial write surface.
