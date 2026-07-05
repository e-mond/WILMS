# WILMS - Project Status

**Last updated:** 2026-07-05 (v1.1.1 production hotfixes)  
**Production release:** v1.0.0 (v1.1 merged to main)  
**Hotfix branch:** `hotfix/v1.1.1-production-fixes`  
**Package version:** `1.1.1`

---

## Summary

v1.1.1 addresses verified production defects from post-v1.1 deployment verification: registration address stability, navigation highlighting, audit log action labels, disbursement readable IDs + disburse UI, group member IDs, loan pool form UX, and Switch consistency. No new features.

---

## v1.1.1 Hotfix scope

| Area | Status |
|------|--------|
| Registration address / React #185 | Fixed |
| Navigation (Reports vs Collections) | Fixed |
| Audit log action display + login mapping | Fixed |
| Disbursement `DIS-*` IDs (backend stored) | Fixed + migration `0013` |
| Disburse loan UI (pending ? active) | Fixed |
| Disbursement filter dropdowns | Fixed |
| Group member readable IDs | Fixed |
| Loan pool create form | Fixed |
| Switch / toggle UI | Improved |
| type-check / lint / build | PASS |
| Frontend tests | PASS (438/438) |
| Backend tests | PASS (53/53) |

---

## Verification before merge

```bash
npm ci
npm run type-check
npm run lint
npm run build
npm test
npm test -w @wilms/api
npm run verify:api-integrity
npm run verify:mock-guard
npm run smoke:rbac
npm run smoke:production
```

See `V1.1.1_HOTFIX_REPORT.md` for root causes and evidence.

---

## Recommendation

**Merge hotfix PR** after review. Tag `v1.1.1` only after production deploy and 32/32 smoke pass.
