# Remaining Work Inventory (Pre-P10)

Generated: 2026-06-09  
Sources: BRD v1.0, `requirements-traceability.md`, `progress-tracker.md`, PG-01–PG-06 closures, UI reference images, codebase scan (38 routes).

Legend: **✅ COMPLETED** | **🔄 IN PROGRESS** | **🔲 NOT STARTED** | **⚠️ BLOCKED**

---

## Foundation & Platform

| Unit | Item | Status | Notes |
|---|---|---|---|
| F-01 | Next.js + TS + Tailwind scaffold | ✅ | |
| F-02 | Design tokens (`tokens.css`, Tailwind) | ✅ | Executive gold, status colours |
| F-03 | Base UI library (Button, Input, Modal, Drawer, etc.) | ✅ | 16+ primitive tests |
| F-04 | Logger / analytics / errorTracking | ✅ | Swappable providers |
| F-05 | Auth store + middleware role gates | ✅ | 4 role route groups |
| F-06 | Offline queue + sync | ✅ | Collector payments |
| F-07 | Mock service layer + dev/prod switch | ✅ | 20 `I*Service` interfaces |
| F-08 | Demo mode banner | ✅ | Development only |
| UI-01 | Theme + office shell | ✅ | Light/dark persist |
| UI-02 | PG-01 dashboard reference compliance | ✅ | Closure doc |
| UI-03 | Detail/profile executive layout | ✅ | |
| UI-04 | Toast, drawer nav, responsive E2E | ✅ | |
| EXP-01 | Export standard (PDF/Excel/CSV/Print) | ✅ | iframe print |
| UX-01 | Login branding + password toggle | ✅ | |
| UX-02 | App lock / PIN | ✅ | Collector security |
| UX-03 | Splash + session restore | ✅ | |
| UX-04 | PWA manifest + SW + install banner | ✅ | |
| GS-01 | Global search omnibar | ✅ | Ctrl+K |
| DA-01–DA-11 | Dashboard shell architecture | ✅ | Sidebar, aside, navbar |
| QA-01 | Playwright E2E (91 tests) | ✅ | Some desktop flake |
| QA-02 | Vitest coverage thresholds | ✅ | 80/75/80/80 |
| QA-03 | WCAG axe audit | ✅ | |
| QA-04 | npm audit | 🔄 | 14 vulns; major bumps deferred |

---

## Authentication

| Page / Feature | Workflow | Status | Gap |
|---|---|---|---|
| `/login` | Email/password + demo account picker | ✅ | |
| `/login` | Remember email preference | ✅ | |
| `/session-expired` | Redirect + re-auth | ✅ | |
| POST `/api/auth/login` | httpOnly session cookie | ✅ | Production API path TBD |
| POST `/api/auth/logout` | Clear session | ✅ | |
| Middleware | Role-based route protection | ✅ | REQ-086 matrix E2E incomplete |
| All shells | Logout control | ✅ | Sidebar footer refactor complete |

---

## Super Admin — Dashboard (`/dashboard`)

| Feature | Status | Notes |
|---|---|---|
| KPI grid (pool, disbursed, collected, outstanding) | ✅ | Service-driven |
| KPI trends + icons | ✅ | |
| Borrower status bar + 5 segments | ✅ | |
| Quick actions (3 links) | ✅ | Touch targets 44px |
| Collector performance table (desktop) | ✅ | |
| Collector performance cards (mobile/tablet) | ✅ | Pre-P10 responsive pass |
| Group risk donut + legend | ✅ | Responsive pass |
| Cycle snapshot metrics | ✅ | Responsive pass |
| Recent alerts aside | ✅ | Drawer `<xl`; theme tokens |
| Dashboard responsive audit | ✅ | `dashboard-responsive-audit.md` |
| Reference image parity | ✅ | PG-01 closure |

---

## Super Admin — Borrowers (`/borrowers`, `/borrowers/[id]`, `/borrowers/[id]/loan`)

| Feature | Status | Notes |
|---|---|---|
| Borrower list + search/filters | ✅ | |
| Applications filter (`?status=PENDING`) | ✅ | Nav + aside sync |
| Borrower profile panel | ✅ | GM-04 closure |
| Active loan detail + schedule + payment log | ✅ | REQ-037–043 |
| Export borrower profile | ✅ | |
| Borrower edit / relocation | 🔲 | REQ-068 |
| Deceased flag workflow | 🔲 | REQ-064 |

---

## Super Admin — Loan Pools (`/loan-pools`)

| Feature | Status | Notes |
|---|---|---|
| KPI cards + utilisation table | ✅ | PG-04 closure |
| Pool detail aside | ✅ | |
| Reference scale data | ✅ | Factory |

---

## Super Admin — Applications (via `/borrowers?status=PENDING`)

| Feature | Status | Notes |
|---|---|---|
| Pending applications list | ✅ | Super Admin view |
| Applications aside panel | ✅ | Pending count KPI |
| Dedicated `/applications` route | 🔲 | Uses query filter today |

---

## Super Admin — Disbursements (`/loans`)

| Feature | Status | Notes |
|---|---|---|
| Loan portfolio list + filters | ✅ | LM-03 |
| Create loan wizard `/loans/new` | ✅ | LM-01/02 |
| Loan detail `/loans/[id]` | ✅ | Schedule + metrics |
| Disbursement + notifications | ✅ | REQ-056 |
| Withdrawal transaction type | 🔲 | REQ-046 |
| Wrong disbursement adjustment path | 🔲 | REQ-073 |

---

## Super Admin — Collections (`/reports/daily-collection`)

| Feature | Status | Notes |
|---|---|---|
| Daily collection report panel | ✅ | |
| Date + collector filters | 🔄 | Collector dropdown uses `DEMO_ACCOUNTS` |
| CSV export | ✅ | |
| Variance review quick action | ✅ | Links from dashboard |

---

## Super Admin — Collectors (`/collectors`, `/collectors/[id]`)

| Feature | Status | Notes |
|---|---|---|
| 34-collector reference table | ✅ | PG-03 |
| KPI summary + rate distribution | ✅ | |
| Collector profile aside | ✅ | |
| Edit frequency metric | 🔄 | REQ-063 partial |
| Daily activity log | 🔄 | REQ-063 partial |
| Collector performance report | 🔄 | Panel exists; E2E pending REQ-079 |

---

## Super Admin — Groups (`/groups`, `/groups/[id]`)

| Feature | Status | Notes |
|---|---|---|
| 148 groups reference list | ✅ | PG-02 |
| Risk filters + pagination | ✅ | |
| Group profile (leader, members, risk history) | ✅ | GM-02/04 |
| Joint liability alerts | 🔲 | REQ-024 |
| Group dissolution | 🔲 | REQ-071 |

---

## Super Admin — Risk & Flags (`/risk-flags`)

| Feature | Status | Notes |
|---|---|---|
| Flag table + KPIs + breakdown | ✅ | PG-05 |
| Raise flag modal + audit | ✅ | P7–P9 |
| Blacklist feed | ✅ | |
| Overpayment review queue | ✅ | EC-01 |

---

## Super Admin — Audit Log (`/reports/audit-log`)

| Feature | Status | Notes |
|---|---|---|
| Immutable audit table | ✅ | REQ-053 |
| Date/user/action filters | 🔄 | User filter from `DEMO_ACCOUNTS` |
| CSV export | ✅ | |
| Read-on-write audit for all mutations | 🔄 | REQ-088 partial |

---

## Super Admin — Reports Hub (`/reports` + 9 report routes)

| Report route | Panel | Status | Gap |
|---|---|---|---|
| `/reports` | Index + aside catalog | ✅ | 9 reports |
| `/reports/loan-portfolio` | LoanPortfolioReportPanel | ✅ | REQ-076 |
| `/reports/daily-collection` | DailyCollectionReportPanel | 🔄 | Filter dropdown |
| `/reports/defaulters` | DefaulterReportPanel | 🔄 | E2E pending REQ-078 |
| `/reports/collector-performance` | CollectorPerformanceReportPanel | 🔄 | E2E pending REQ-079 |
| `/reports/group-risk` | GroupRiskReportPanel | 🔄 | E2E pending REQ-080 |
| `/reports/financial-ledger` | FinancialLedgerReportPanel | 🔄 | E2E REQ-081; REQ-045 types |
| `/reports/audit-log` | AuditLogReportPanel | 🔄 | User filter |

---

## Super Admin — Settings (`/settings`)

| Section | Status | Notes |
|---|---|---|
| Organisation / branding | 🔄 | Read-only demo fields |
| Loan rules | 🔄 | Read-only demo fields |
| Users CRUD (invite/edit/suspend/delete) | ✅ | P7–P9 mock store |
| Activity log aside | ✅ | |
| System settings API persist | 🔲 | No `updateSettings()` |
| Public holiday reschedule | 🔲 | REQ-067 |
| Reference compliance | ✅ | PG-06 closure |

---

## Super Admin — Adjustments (`/adjustments`)

| Feature | Status | Notes |
|---|---|---|
| Adjustment queue list | ✅ | |
| Approve/reject modal | ✅ | |
| Write-off + blacklist | ✅ | ADJ-02 |
| Payment entry → request adjustment | 🔄 | REQ-036 E2E pending |
| Locked record correction flow | 🔄 | REQ-036 |

---

## Registration Officer

| Page | Feature | Status | Gap |
|---|---|---|---|
| `/officer/register` | 6-step registration wizard | ✅ | REQ-001–012 |
| `/officer/register` | Duplicate phone/ID/name/active loan/blacklist | ✅ | |
| `/officer/register` | Photo upload (camera + file) | ✅ | Multipart API TBD |
| `/officer/register` | Registration flag audit | 🔲 | REQ-013 |
| `/officer/my-registrations` | List + search/filter | ✅ | |
| `/officer/my-registrations` | Pagination | 🔲 | OFF-ENH |
| `/officer/my-registrations` | Detail view + edit | 🔲 | OFF-ENH |
| REG-ENH | Phone country selector | 🔲 | |
| REG-ENH | GPS capture on address | 🔲 | |
| REG-ENH | Signature / fingerprint | 🔲 | |

---

## Approver

| Page | Feature | Status | Gap |
|---|---|---|---|
| `/approver/pending` | Pending queue | ✅ | REQ-014 |
| `/approver/pending/[id]` | Profile review | ✅ | |
| `/approver/pending/[id]` | Approve / Reject / Blacklist | ✅ | REQ-015–018 |
| `/approver/pending/[id]` | SMS/email on approve/reject | ✅ | REQ-054–055 |
| `/approver/reviewed` | Reviewed history | ✅ | AW-04 |

---

## Collector (Field)

| Page | Feature | Status | Gap |
|---|---|---|---|
| `/collector/dashboard` | Today's borrowers, expected/collected | ✅ | REQ-075 |
| `/collector/dashboard` | Missed alerts, reconciliation status | ✅ | |
| `/collector/my-borrowers` | Assigned borrower list | ✅ | |
| `/collector/payment/[id]` | Payment entry + GPS | ✅ | REQ-028–035, 052 |
| `/collector/payment/[id]` | Same-day edit + audit | ✅ | |
| `/collector/payment/[id]` | Offline queue | ✅ | REQ-069 |
| `/collector/payment/[id]` | Duplicate block | ✅ | REQ-070 |
| `/collector/payment/[id]` | Overpayment block | ✅ | REQ-039/066 |
| `/collector/payment/[id]` | Borrower SMS receipt | 🔲 | REQ-050 |
| `/collector/reconciliation` | Daily reconciliation form | ✅ | REQ-047–049 |
| `/collector/admin-fee` | Fee recording list | ✅ | REQ-019–021 |
| `/collector/admin-fee/[borrowerId]` | Record fee | ✅ | AMB-001 amount |
| `/collector/security` | PIN setup | ✅ | UX-02 |
| Collector shell | Bottom nav + offline banner | ✅ | |
| Performance on 3G | <2s load | 🔲 | REQ-083 |

---

## Edge Cases (BRD §16)

| Case | Status | REQ |
|---|---|---|
| Overpayment review | ✅ | REQ-066 |
| Death of borrower | 🔲 | REQ-064 |
| Guarantor unreachable | 🔲 | REQ-065 |
| Public holiday reschedule | 🔲 | REQ-067 |
| Borrower relocation | 🔲 | REQ-068 |
| System downtime / offline | ✅ | REQ-069/084 |
| Duplicate transaction | ✅ | REQ-070 |
| Group dissolution | 🔲 | REQ-071 |
| Loan write-off | ✅ | REQ-072 |
| Wrong disbursement amount | 🔲 | REQ-073 |

---

## Non-Functional Requirements

| REQ | Description | Status |
|---|---|---|
| REQ-083 | Collector dashboard <2s on 3G | 🔲 |
| REQ-084 | Offline sync within 15 min | ✅ |
| REQ-085 | 500 concurrent users | 🔲 | Backend |
| REQ-086 | RBAC data scoping | 🔄 | Middleware only |
| REQ-087 | Encryption at rest | ⚠️ | Backend assumption |
| REQ-088 | Audit every read/write/delete | 🔄 | Writes mostly logged |

---

## Sidebar refactor (Pre-P10)

| Item | Status |
|---|---|
| Top collapse `<` / expand `>` only | ✅ |
| No bottom toggle | ✅ |
| WILMS logo + brand text expanded | ✅ |
| Brand mark only collapsed | ✅ |
| 12 Super Admin nav icons | ✅ |
| Footer: version + logout expanded | ✅ |
| Footer: logout icon collapsed | ✅ |
| Gold executive active nav | ✅ |

---

## Pre-P10 gate checklist

| # | Deliverable | Status |
|---|---|---|
| 1 | Dashboard responsive audit | ✅ |
| 2 | Sidebar refactor | ✅ |
| 3 | Remaining work inventory (this doc) | ✅ |
| 4 | Backend integration readiness | ✅ |
| 5 | Mock data compliance audit | ✅ |
| 6 | P10 lint / type-check / test / build | 🔄 | Run after docs |

---

## Blocked items

| ID | Item | Awaiting |
|---|---|---|
| AMB-001 | Admin fee pesewas amount | Business stakeholder |
| REQ-087 | Field encryption at rest | Backend architecture |
