# P11b Remaining Work Inventory

> Generated: 2026-06-09 | Gate: reference / responsive / a11y / dark / mobile / export / print / performance

## Completed in P11b pass

| Area | Deliverable |
|---|---|
| Shell | Dynamic sidebar role via `getRoleLabel()` + session |
| Shell | Global navbar actions (online, search, notifications, settings, lock, profile) |
| Shell | Aside bounded between navbar and footer (`sticky` + `max-height`) |
| Registration | Webcam capture, mobile camera, phone QR session (mock + doc) |
| Registration | Guarantor photo, ID, group, eligibility validation |
| Registration | Signatures (borrower / guarantor / officer) |
| Registration | Enhanced review + print/PDF/CSV export |
| Dashboard | Upper hierarchy realignment (KPIs → risk/quick actions/analytics) |
| Dashboard | Expense summary widget |
| Expenses | Collector expense submission page |
| Permissions | `usePermissions` + `PermissionGate` (service-driven) |
| Performance | Link prefetch on sidebar nav |
| Stability | Root `error.tsx` ChunkLoadError recovery |

---

## P0 — Blockers before production gate

| ID | Item | Status |
|---|---|---|
| P0-01 | Reference image sign-off: Super Admin Dashboard | Open |
| P0-02 | Reference image sign-off: Loan Pools mobile + desktop | Partial (mobile cards exist) |
| P0-03 | Reference image sign-off: Collectors mobile + desktop | Partial |
| P0-04 | Full E2E suite green (desktop timeouts) | Open |
| P0-05 | Backend API wiring (all mock services) | Open |
| P0-06 | Role editor UI (permission matrix editing) | Open |
| P0-07 | User admin: reset password / PIN | Open |

---

## P1 — High priority

| ID | Item | Status |
|---|---|---|
| P1-01 | Profile photos wired in all list/search/audit surfaces | Partial (`Avatar` supports `photoUrl`) |
| P1-02 | Legal config editable in Settings Super Admin UI | Open (service mock only) |
| P1-03 | Phone capture production service + websocket sync | Open |
| P1-04 | Permission checks applied across pages via `PermissionGate` | Foundation only |
| P1-05 | Collector dashboard expense shortcut widget | Open |
| P1-06 | Navigation transition benchmarks in CI | Open |

---

## P2 — Medium

| ID | Item | Status |
|---|---|---|
| P2-01 | AUDITOR / READ_ONLY auth roles in middleware | Open |
| P2-02 | Registration loan section from live application data | Mock preview |
| P2-03 | Aside drawer parity audit all management pages | Open |
| P2-04 | Dark mode page-by-page re-audit post-P11b | Open |
| P2-05 | Export audit for every report page | Open |

---

## P3 — Polish

| ID | Item | Status |
|---|---|---|
| P3-01 | Replace QuickChart QR with backend-generated asset | Open |
| P3-02 | Avatar stacks in group/aside widgets | Open |
| P3-03 | Notification content personalization per role | Open |

---

## Completion rule checklist (global)

| Gate | Status |
|---|---|
| Reference image validation | In progress |
| Responsive audit | Dashboard updated; others pending |
| Accessibility audit | Partial |
| Dark mode audit | Partial |
| Mobile audit | Loan Pools / Collectors pending sign-off |
| Export audit | Registration review added |
| Print audit | Registration review added |
| Performance audit | Prefetch + prior P11 opts; metrics doc pending update |

**No page marked complete until all gates pass.**
