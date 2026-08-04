# Final Work Inventory

Recorded: 2026-06-09

## Completed

| Area | Notes |
|---|---|
| Dashboard | Super Admin hierarchy, collection/expense widgets |
| Groups | Profile, members, leader/collector sections |
| Borrowers | Registration, profiles, avatars |
| Registration workflow | Optional signatures, mobile capture, agreement document |
| Exports | Registration, borrower, group, risk — not in Settings |
| Loan Pools | Mobile card list, selection bar |
| Mobile parity | Collectors cards, toolbar touch targets |
| Role settings | All roles including Auditor |
| Expenses | Collector + admin panels |
| Shell architecture | Navbar, sidebar collapse, aside constraints |
| Responsive work | P0 mobile reference parity |
| RBAC foundation | Permission models, PermissionProvider, PermissionGate, route matrix |
| Demo mode | IDataProvider + IDataSource alias, `NEXT_PUBLIC_DEMO_MODE` |
| Build health | Clean rebuild verified |
| User management | Expanded profile modal with security actions |
| Auditor role | Portal, nav, demo account, settings |

---

## Remaining

### P0 (before production)

| Item | Estimate |
|---|---|
| Roll PermissionGate to all action surfaces (exports, approvals, edits, deletes) | 2–3 days |
| Session cookie embed permission snapshot for edge middleware | 1 day |
| Dashboard JPEG responsive sign-off | 0.5 day |
| E2E RBAC matrix tests | 1 day |

### P1

| Item | Estimate |
|---|---|
| User permission override UI (Super Admin) | 2 days |
| Security action wiring (reset password/PIN, force logout) to API | 2 days |
| Biometric app lock (WebAuthn) | 3 days |
| Print/PDF visual parity with on-screen registration agreement | 2 days |
| Real-time dashboard refresh / notifications | 3 days |

### P2

| Item | Estimate |
|---|---|
| Ultrawide layout polish | 1 day |
| Auditor read-only enforcement on all mutation endpoints | 1 day |
| Performance profiling large tables | 2 days |
| Accessibility audit (WCAG 2.1 AA) | 3 days |

---

## Do Not Start Until Complete

- [x] Runtime chunk error resolved
- [x] RBAC foundation in place
- [x] Remaining work inventory (this document)
- [x] Backend readiness audit
- [x] Demo mode fallback verified

**Next phase:** PermissionGate rollout across all pages + backend API integration.
