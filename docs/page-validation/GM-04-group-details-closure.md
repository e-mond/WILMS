# GM-04 — Group Details & Borrower Profile Closure
> **Routes:** `/groups/[id]`, `/borrowers/[id]`  
> **Closed:** 2026-06-09

---

## Summary

Full Group Details and Borrower Profile workflows are implemented for Super Admin demo scope.

| Area | Status |
|---|---|
| Group Details page (information, leader, collector, members) | ✅ Complete |
| Group member search/filter + borrower profile links | ✅ Complete |
| Borrower Profile (personal, loan, payments, schedule, risk) | ✅ Complete |
| AppAside on group detail (`GroupProfileAsidePanel`) | ✅ Complete |
| AppAside on borrower profile (quick actions) | ✅ Complete |
| Group actions + audit (flag, membership validation) | ✅ Complete |
| Membership management UI (add/remove/transfer/leader/collector/adjustment) | ✅ Complete |
| Export CSV / Excel / print PDF | ✅ Complete |
| Cross-links (groups list, members, borrower group, dashboard, reports) | ✅ Complete |
| Synthetic member/collector data for all 148 demo groups | ✅ Complete |

---

## Validation

| Check | Result |
|---|---|
| `GroupProfilePanel.test.tsx` | ✅ Pass |
| `BorrowerProfilePanel.test.tsx` | ✅ Pass |
| `group-detail.test.ts` | ✅ Pass |
| Type-check / lint | ✅ Pass |

---

## Next

PG-04 `/loan-pools` reference compliance per progress tracker.
