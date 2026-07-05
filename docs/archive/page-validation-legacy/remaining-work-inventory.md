# Remaining Work Inventory (Pre-P10)

Generated: 2026-06-09  
Sources: BRD v1.0, `requirements-traceability.md`, `progress-tracker.md`, PG-01ÔÇôPG-06 closures, UI reference images, codebase scan (38 routes).

Legend: **Ô£à COMPLETED** | **­ƒöä IN PROGRESS** | **­ƒö▓ NOT STARTED** | **ÔÜá´©Å BLOCKED**

---

## Foundation & Platform

| Unit | Item | Status | Notes |
|---|---|---|---|
| F-01 | Next.js + TS + Tailwind scaffold | Ô£à | |
| F-02 | Design tokens (`tokens.css`, Tailwind) | Ô£à | Executive gold, status colours |
| F-03 | Base UI library (Button, Input, Modal, Drawer, etc.) | Ô£à | 16+ primitive tests |
| F-04 | Logger / analytics / errorTracking | Ô£à | Swappable providers |
| F-05 | Auth store + middleware role gates | Ô£à | 4 role route groups |
| F-06 | Offline queue + sync | Ô£à | Collector payments |
| F-07 | Mock service layer + dev/prod switch | Ô£à | 20 `I*Service` interfaces |
| F-08 | Demo mode banner | Ô£à | Development only |
| UI-01 | Theme + office shell | Ô£à | Light/dark persist |
| UI-02 | PG-01 dashboard reference compliance | Ô£à | Closure doc |
| UI-03 | Detail/profile executive layout | Ô£à | |
| UI-04 | Toast, drawer nav, responsive E2E | Ô£à | |
| EXP-01 | Export standard (PDF/Excel/CSV/Print) | Ô£à | iframe print |
| UX-01 | Login branding + password toggle | Ô£à | |
| UX-02 | App lock / PIN | Ô£à | Collector security |
| UX-03 | Splash + session restore | Ô£à | |
| UX-04 | PWA manifest + SW + install banner | Ô£à | |
| GS-01 | Global search omnibar | Ô£à | Ctrl+K |
| DA-01ÔÇôDA-11 | Dashboard shell architecture | Ô£à | Sidebar, aside, navbar |
| QA-01 | Playwright E2E (91 tests) | Ô£à | Some desktop flake |
| QA-02 | Vitest coverage thresholds | Ô£à | 80/75/80/80 |
| QA-03 | WCAG axe audit | Ô£à | |
| QA-04 | npm audit | ­ƒöä | 14 vulns; major bumps deferred |

---

## Authentication

| Page / Feature | Workflow | Status | Gap |
|---|---|---|---|
| `/login` | Email/password + demo account picker | Ô£à | |
| `/login` | Remember email preference | Ô£à | |
| `/session-expired` | Redirect + re-auth | Ô£à | |
| POST `/api/auth/login` | httpOnly session cookie | Ô£à | Production API path TBD |
| POST `/api/auth/logout` | Clear session | Ô£à | |
| Middleware | Role-based route protection | Ô£à | REQ-086 matrix E2E incomplete |
| All shells | Logout control | Ô£à | Sidebar footer refactor complete |

---

## Super Admin ÔÇö Dashboard (`/dashboard`)

| Feature | Status | Notes |
|---|---|---|
| KPI grid (pool, disbursed, collected, outstanding) | Ô£à | Service-driven |
| KPI trends + icons | Ô£à | |
| Borrower status bar + 5 segments | Ô£à | |
| Quick actions (3 links) | Ô£à | Touch targets 44px |
| Collector performance table (desktop) | Ô£à | |
| Collector performance cards (mobile/tablet) | Ô£à | Pre-P10 responsive pass |
| Group risk donut + legend | Ô£à | Responsive pass |
| Cycle snapshot metrics | Ô£à | Responsive pass |
| Recent alerts aside | Ô£à | Drawer `<xl`; theme tokens |
| Dashboard responsive audit | Ô£à | `dashboard-responsive-audit.md` |
| Reference image parity | Ô£à | PG-01 closure |

---

## Super Admin ÔÇö Borrowers (`/borrowers`, `/borrowers/[id]`, `/borrowers/[id]/loan`)

| Feature | Status | Notes |
|---|---|---|
| Borrower list + search/filters | Ô£à | |
| Applications filter (`?status=PENDING`) | Ô£à | Nav + aside sync |
| Borrower profile panel | Ô£à | GM-04 closure |
| Active loan detail + schedule + payment log | Ô£à | REQ-037ÔÇô043 |
| Export borrower profile | Ô£à | |
| Borrower edit / relocation | ­ƒö▓ | REQ-068 |
| Deceased flag workflow | ­ƒö▓ | REQ-064 |

---

## Super Admin ÔÇö Loan Pools (`/loan-pools`)

| Feature | Status | Notes |
|---|---|---|
| KPI cards + utilisation table | Ô£à | PG-04 closure |
| Pool detail aside | Ô£à | |
| Reference scale data | Ô£à | Factory |

---

## Super Admin ÔÇö Applications (via `/borrowers?status=PENDING`)

| Feature | Status | Notes |
|---|---|---|
| Pending applications list | Ô£à | Super Admin view |
| Applications aside panel | Ô£à | Pending count KPI |
| Dedicated `/applications` route | ­ƒö▓ | Uses query filter today |

---

## Super Admin ÔÇö Disbursements (`/loans`)

| Feature | Status | Notes |
|---|---|---|
| Loan portfolio list + filters | Ô£à | LM-03 |
| Create loan wizard `/loans/new` | Ô£à | LM-01/02 |
| Loan detail `/loans/[id]` | Ô£à | Schedule + metrics |
| Disbursement + notifications | Ô£à | REQ-056 |
| Withdrawal transaction type | ­ƒö▓ | REQ-046 |
| Wrong disbursement adjustment path | ­ƒö▓ | REQ-073 |

---

## Super Admin ÔÇö Collections (`/reports/daily-collection`)

| Feature | Status | Notes |
|---|---|---|
| Daily collection report panel | Ô£à | |
| Date + collector filters | ­ƒöä | Collector dropdown uses `DEMO_ACCOUNTS` |
| CSV export | Ô£à | |
| Variance review quick action | Ô£à | Links from dashboard |

---

## Super Admin ÔÇö Collectors (`/collectors`, `/collectors/[id]`)

| Feature | Status | Notes |
|---|---|---|
| 34-collector reference table | Ô£à | PG-03 |
| KPI summary + rate distribution | Ô£à | |
| Collector profile aside | Ô£à | |
| Edit frequency metric | ­ƒöä | REQ-063 partial |
| Daily activity log | ­ƒöä | REQ-063 partial |
| Collector performance report | ­ƒöä | Panel exists; E2E pending REQ-079 |

---

## Super Admin ÔÇö Groups (`/groups`, `/groups/[id]`)

| Feature | Status | Notes |
|---|---|---|
| 148 groups reference list | Ô£à | PG-02 |
| Risk filters + pagination | Ô£à | |
| Group profile (leader, members, risk history) | Ô£à | GM-02/04 |
| Joint liability alerts | ­ƒö▓ | REQ-024 |
| Group dissolution | ­ƒö▓ | REQ-071 |

---

## Super Admin ÔÇö Risk & Flags (`/risk-flags`)

| Feature | Status | Notes |
|---|---|---|
| Flag table + KPIs + breakdown | Ô£à | PG-05 |
| Raise flag modal + audit | Ô£à | P7ÔÇôP9 |
| Blacklist feed | Ô£à | |
| Overpayment review queue | Ô£à | EC-01 |

---

## Super Admin ÔÇö Audit Log (`/reports/audit-log`)

| Feature | Status | Notes |
|---|---|---|
| Immutable audit table | Ô£à | REQ-053 |
| Date/user/action filters | ­ƒöä | User filter from `DEMO_ACCOUNTS` |
| CSV export | Ô£à | |
| Read-on-write audit for all mutations | ­ƒöä | REQ-088 partial |

---

## Super Admin ÔÇö Reports Hub (`/reports` + 9 report routes)

| Report route | Panel | Status | Gap |
|---|---|---|---|
| `/reports` | Index + aside catalog | Ô£à | 9 reports |
| `/reports/loan-portfolio` | LoanPortfolioReportPanel | Ô£à | REQ-076 |
| `/reports/daily-collection` | DailyCollectionReportPanel | ­ƒöä | Filter dropdown |
| `/reports/defaulters` | DefaulterReportPanel | ­ƒöä | E2E pending REQ-078 |
| `/reports/collector-performance` | CollectorPerformanceReportPanel | ­ƒöä | E2E pending REQ-079 |
| `/reports/group-risk` | GroupRiskReportPanel | ­ƒöä | E2E pending REQ-080 |
| `/reports/financial-ledger` | FinancialLedgerReportPanel | ­ƒöä | E2E REQ-081; REQ-045 types |
| `/reports/audit-log` | AuditLogReportPanel | ­ƒöä | User filter |

---

## Super Admin ÔÇö Settings (`/settings`)

| Section | Status | Notes |
|---|---|---|
| Organisation / branding | ­ƒöä | Read-only demo fields |
| Loan rules | ­ƒöä | Read-only demo fields |
| Users CRUD (invite/edit/suspend/delete) | Ô£à | P7ÔÇôP9 mock store |
| Activity log aside | Ô£à | |
| System settings API persist | ­ƒö▓ | No `updateSettings()` |
| Public holiday reschedule | ­ƒö▓ | REQ-067 |
| Reference compliance | Ô£à | PG-06 closure |

---

## Super Admin ÔÇö Adjustments (`/adjustments`)

| Feature | Status | Notes |
|---|---|---|
| Adjustment queue list | Ô£à | |
| Approve/reject modal | Ô£à | |
| Write-off + blacklist | Ô£à | ADJ-02 |
| Payment entry ÔåÆ request adjustment | ­ƒöä | REQ-036 E2E pending |
| Locked record correction flow | ­ƒöä | REQ-036 |

---

## Registration Officer

| Page | Feature | Status | Gap |
|---|---|---|---|
| `/officer/register` | 6-step registration wizard | Ô£à | REQ-001ÔÇô012 |
| `/officer/register` | Duplicate phone/ID/name/active loan/blacklist | Ô£à | |
| `/officer/register` | Photo upload (camera + file) | Ô£à | Multipart API TBD |
| `/officer/register` | Registration flag audit | ­ƒö▓ | REQ-013 |
| `/officer/my-registrations` | List + search/filter | Ô£à | |
| `/officer/my-registrations` | Pagination | ­ƒö▓ | OFF-ENH |
| `/officer/my-registrations` | Detail view + edit | ­ƒö▓ | OFF-ENH |
| REG-ENH | Phone country selector | ­ƒö▓ | |
| REG-ENH | GPS capture on address | ­ƒö▓ | |
| REG-ENH | Signature / fingerprint | ­ƒö▓ | |

---

## Approver

| Page | Feature | Status | Gap |
|---|---|---|---|
| `/approver/pending` | Pending queue | Ô£à | REQ-014 |
| `/approver/pending/[id]` | Profile review | Ô£à | |
| `/approver/pending/[id]` | Approve / Reject / Blacklist | Ô£à | REQ-015ÔÇô018 |
| `/approver/pending/[id]` | SMS/email on approve/reject | Ô£à | REQ-054ÔÇô055 |
| `/approver/reviewed` | Reviewed history | Ô£à | AW-04 |

---

## Collector (Field)

| Page | Feature | Status | Gap |
|---|---|---|---|
| `/collector/dashboard` | Today's borrowers, expected/collected | Ô£à | REQ-075 |
| `/collector/dashboard` | Missed alerts, reconciliation status | Ô£à | |
| `/collector/my-borrowers` | Assigned borrower list | Ô£à | |
| `/collector/payment/[id]` | Payment entry + GPS | Ô£à | REQ-028ÔÇô035, 052 |
| `/collector/payment/[id]` | Same-day edit + audit | Ô£à | |
| `/collector/payment/[id]` | Offline queue | Ô£à | REQ-069 |
| `/collector/payment/[id]` | Duplicate block | Ô£à | REQ-070 |
| `/collector/payment/[id]` | Overpayment block | Ô£à | REQ-039/066 |
| `/collector/payment/[id]` | Borrower SMS receipt | ­ƒö▓ | REQ-050 |
| `/collector/reconciliation` | Daily reconciliation form | Ô£à | REQ-047ÔÇô049 |
| `/collector/admin-fee` | Fee recording list | Ô£à | REQ-019ÔÇô021 |
| `/collector/admin-fee/[borrowerId]` | Record fee | Ô£à | AMB-001 amount |
| `/collector/security` | PIN setup | Ô£à | UX-02 |
| Collector shell | Bottom nav + offline banner | Ô£à | |
| Performance on 3G | <2s load | ­ƒö▓ | REQ-083 |

---

## Edge Cases (BRD ┬º16)

| Case | Status | REQ |
|---|---|---|
| Overpayment review | Ô£à | REQ-066 |
| Death of borrower | ­ƒö▓ | REQ-064 |
| Guarantor unreachable | ­ƒö▓ | REQ-065 |
| Public holiday reschedule | ­ƒö▓ | REQ-067 |
| Borrower relocation | ­ƒö▓ | REQ-068 |
| System downtime / offline | Ô£à | REQ-069/084 |
| Duplicate transaction | Ô£à | REQ-070 |
| Group dissolution | ­ƒö▓ | REQ-071 |
| Loan write-off | Ô£à | REQ-072 |
| Wrong disbursement amount | ­ƒö▓ | REQ-073 |

---

## Non-Functional Requirements

| REQ | Description | Status |
|---|---|---|
| REQ-083 | Collector dashboard <2s on 3G | ­ƒö▓ |
| REQ-084 | Offline sync within 15 min | Ô£à |
| REQ-085 | 500 concurrent users | ­ƒö▓ | Backend |
| REQ-086 | RBAC data scoping | ­ƒöä | Middleware only |
| REQ-087 | Encryption at rest | ÔÜá´©Å | Backend assumption |
| REQ-088 | Audit every read/write/delete | ­ƒöä | Writes mostly logged |

---

## Sidebar refactor (Pre-P10)

| Item | Status |
|---|---|
| Top collapse `<` / expand `>` only | Ô£à |
| No bottom toggle | Ô£à |
| WILMS logo + brand text expanded | Ô£à |
| Brand mark only collapsed | Ô£à |
| 12 Super Admin nav icons | Ô£à |
| Footer: version + logout expanded | Ô£à |
| Footer: logout icon collapsed | Ô£à |
| Gold executive active nav | Ô£à |

---

## Pre-P10 gate checklist

| # | Deliverable | Status |
|---|---|---|
| 1 | Dashboard responsive audit | Ô£à |
| 2 | Sidebar refactor | Ô£à |
| 3 | Remaining work inventory (this doc) | Ô£à |
| 4 | Backend integration readiness | Ô£à |
| 5 | Mock data compliance audit | Ô£à |
| 6 | P10 lint / type-check / test / build | ­ƒöä | Run after docs |

---

## Blocked items

| ID | Item | Awaiting |
|---|---|---|
| AMB-001 | Admin fee pesewas amount | Business stakeholder |
| REQ-087 | Field encryption at rest | Backend architecture |
