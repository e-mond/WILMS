# RC1 — Responsive Audit

**Gate:** GATE 4  
**Date:** 2026-06-30

---

## Breakpoints (RC1 matrix)

| Label | Width | Height |
|-------|-------|--------|
| mobile-320 | 320 | 568 |
| mobile-375 | 375 | 812 |
| mobile-390 | 390 | 844 |
| tablet-768 | 768 | 1024 |
| desktop-1024 | 1024 | 768 |
| desktop-1366 | 1366 | 768 |
| wide-1920 | 1920 | 1080 |

---

## Test suite

`apps/frontend/e2e/responsive-breakpoints.spec.ts` — login, collector shell, super-admin, registration officer, approver at each breakpoint.

---

## Checks

- Sidebar/nav collapse at mobile breakpoints
- No horizontal overflow on shell landmarks
- Operational mobile bottom nav for field roles

---

**Verdict:** RC1 breakpoint matrix implemented in e2e. Run `npm run test:e2e` for full evidence.
