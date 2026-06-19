# WILMS — Gap Analysis Report
> Mandatory pre-implementation audit | Last updated: 2026-06-08

---

## Missing / Partial Screens

| Screen | Status | Gap |
|---|---|---|
| `/dashboard` | ✅ PG-01 | Alerts in shell `AppAside`; KPI trends present |
| `/groups`, `/groups/[id]` | ✅ PG-02 | List page: aside, pagination, avatar stack, New Group CTA |
| `/collectors`, `/collectors/[id]` | ✅ PG-03 | List page: avatars, sparklines, bar chart aside, pagination |
| `/loan-pools` | ✅ PG-04 | Aside, pagination, New Pool CTA |
| `/risk-flags` | ✅ PG-05 | Timeline, blacklist avatars, pagination, shell aside |
| `/settings` | ✅ PG-06 | Sub-nav + Security/Users/Loan Rules/SMS (demo read-only) |
| Registration wizard | Partial | Missing phone selector, GPS, signature, official preview |

---

## Missing Features

| Feature | Status |
|---|---|
| `DashboardShell` unified architecture | ✅ Built (DA-01–DA-08) |
| Collapsible sidebar | ✅ Built |
| Shell-level `AppAside` | ✅ Built (PG-* pages inject via `useShellAsideContent`) |
| Global search (GS-01) | ✅ Built |
| Notification inbox UI | ✅ Built (Super Admin) |
| User management (UM-01) | Not built |
| Settings admin forms | Not built |
| Stub buttons (Flag Group, Raise Flag, Message, etc.) | Incorrectly appear complete |

---

## Shell vs Reference

| Requirement | Current | Target |
|---|---|---|
| Single shell implementation | `OfficeShell` + `CollectorShell` | `DashboardShell` |
| Navbar full width | Header inside main column | `AppNavbar` above body |
| Right aside | Page-level only | Shell `AppAside` |

---

## Accessibility / Responsiveness / Theme

| Area | Status |
|---|---|
| WCAG axe on 3 routes | Complete (QA-03) |
| Responsive E2E 4 breakpoints | Complete (QA-01) |
| Full dark-mode audit (TH-01) | Not started |
| Collapsed sidebar keyboard + tooltips | Not built |

---

## Documentation Gaps

| Doc | Status |
|---|---|
| `design-reference-analysis.md` | Complete (this phase) |
| `gap-analysis-report.md` | Complete (this file) |
| ADR-005 shell architecture | In progress |
| `component-catalog.md`, `api-docs.md`, `release-roadmap.md` | Not started |

---

## Corrected Progress Tracker Status

| Unit | Previous | Corrected |
|---|---|---|
| UI-02 | Complete | **Pending re-validation** vs reference JPEGs |
| CP-01 | In progress | **In progress** — sparklines, photos, variance pending |
| BR-01 | Complete | **Partial** — REG-ENH items outstanding |
| Settings | Untracked | **Not started** |
