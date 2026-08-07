# WILMS — Progress Tracker
> Women's Interest-Free Loan Management System | Living Development Log

**Update this file after every meaningful implementation change.**
| Super Admin route `/loan-pools` redirected to dashboard | ✅ Fixed — added `/loan-pools` and `/risk-flags` to middleware `ROLE_ROUTE_PREFIXES` |
| P11a collection metrics on dashboard | ✅ `DashboardCollectionSummary` wired to transaction-backed service |

---

## Definition of Done — Honesty Note

Units marked ✅ implement core behaviour and unit tests. **Global DoD is not met** until E2E (Playwright), coverage thresholds, WCAG audit, and `npm audit` pass for each unit. Several ✅ rows are **functionally complete but validation-incomplete** — see QA units below.

---

## Current Phase

| Phase | Status |
|---|---|
| Phase 1 — Analysis & Planning | ✅ Complete |
| Phase 2 — Context Documentation | ✅ Complete |
| Phase 3 — Frontend Architecture | ✅ Complete |
| Phase 4 — Frontend Development | 🔄 In Progress (~70% core BRD flows) |
| **v1.6.1 Product Excellence UI** | ✅ Complete — PR #160 |
| **v1.6.2 Enterprise Readiness** | ✅ Complete — PR #161 |
| **v1.7.0 Finance & Intelligence** | ✅ Complete — PR #162; reports in `docs/v1.7/` |
| **v1.7.0 Ops/UX hardening** | ✅ Complete — PR #163 |
| **v1.7.2 Release Candidate** | ✅ Complete — last feature platform release; pack in `docs/v1.7.2/` |
| **v1.7.3 Documentation Suite** | ✅ Complete — branch `feature/v1.7.3-documentation-suite`; library in `documentation/`; pack in `docs/v1.7.3/` |
| **v1.7.1 Market Readiness** | ✅ Merged (#165 / #166); pack in `docs/v1.7.1/` |

---


---

## v1.5 Platform Consolidation

| Phase | Status | Notes |
|---|---|---|
| Phase A — Domain extraction (`@wilms/domain`) | Complete | Domain package hosts API/db; thin `@wilms/api` adapter |
| Phase B — Express → Route Handlers | Complete | Catch-all `/api/wilms/[...path]` in-process; review checkpoint documented |
| Phase C — Shared domain cleanup | Complete | FE `src/lib/*` re-exports; shared package surface |
| Phase D — Remove cross-origin BFF | Complete | In-process default; proxy only via `WILMS_API_MODE=proxy` |
| Phase E — Vercel Cron scheduler | Complete | `/api/cron/notifications` daily 06:00 UTC; GHA schedule disabled |
| Phase F — Ops, UI, cutover, 1.5.0 | Complete | Reports + version bump; Railway optional rollback only |


## Implementation Unit Status

Each row represents one scoped, verifiable unit of work.

### Documentation

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| DOC-01 | Adopt Production Edition prompt + `context/` folder restructure | Complete | 2026-06-06 | `production-frontend-prompt.md` replaced; 7 context docs + 4 ADRs moved |

### Foundation

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| F-01 | Project scaffolding (Next.js + TS + Tailwind) | ✅ Complete | 2026-06-06 | Restored after workspace rollback |
| F-02 | Design system tokens (tailwind.config.ts) | ✅ Complete | 2026-06-06 | Restored — CSS vars + semantic Tailwind tokens |
| F-03 | Base shared component library (Button, Input, Badge, Modal, etc.) | ✅ Complete | 2026-06-06 | Tier 1 ui/ + feedback/ primitives restored; 16 component tests |
| F-04 | Logging, analytics, errorTracking abstractions | ✅ Complete | 2026-06-06 | Provider-based logger, analytics, errorTracking; swappable via setProvider |
| F-05 | Auth store + role-based route protection (middleware) | ✅ Complete | 2026-06-06 | Zustand authStore, middleware, RoleGuard, session-expired |
| F-06 | Offline queue store + sync mechanism | ✅ Complete | 2026-06-06 | Zustand offlineQueueStore (localStorage persist), FIFO drain, OfflineBanner, CollectorOfflineShell; sync handler wired in F-07; 10 offline-queue tests |
| F-07 | Mock service layer scaffolding (dev/prod switch) | ✅ Complete | 2026-06-06 | 7 services + apiClient; NODE_ENV switch in services/index.ts; offline replay wired to paymentService; ESLint mock isolation; 9 service tests |
| F-08 | Demo Mode banner component | ✅ Complete | 2026-06-06 | DemoModeBanner in root layout; development-only via NODE_ENV; role=status; 3 component tests |
| UI-01 | Theme system + shared office shell layout | ✅ Complete | 2026-06-06 | themeStore (localStorage persist), ThemeProvider/Toggle, OfficeShell/PageShell; all office roles share header/footer/sidebar pattern; executive sidebar scoped tokens; 33 routes; 237 tests |
| UI-02 | Executive dashboard design reference compliance | ✅ Complete | 2026-06-08 | PG-01 closed — `docs/archive/page-validation/PG-01-dashboard-closure.md` |
| UI-03 | Layout consistency — detail, profile & field pages | ✅ Complete | 2026-06-07 | Detail routes use `PageShell variant="executive"`; profile panels + payment/reconciliation/admin-fee use executive KPI/sidebar layout; Applications nav → pending filter; notification placeholder removed; theme initializer on Officer/Approver |
| EXP-01 | WILMS Export & Reporting Standard | ✅ Complete | 2026-06-09 | `src/features/export/` — PDF/Excel/CSV/Print engines; iframe print (no popups); borrower profile exports — `context/export-strategy.md` |
| UI-04 | Design system audit — theme, tokens, toast, mobile nav | ✅ Complete | 2026-06-08 | Toast + Drawer mobile nav + responsive E2E; WCAG remediations in QA-03 (`context/accessibility-audit.md`) |

### Dashboard Shell Architecture (DA)

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| DA-01 | ADR-005 + design authority docs | ✅ Complete | 2026-06-08 | `ADR-005-dashboard-shell-architecture.md`, `design-reference-analysis.md`, `gap-analysis-report.md` |
| DA-02 | `shellLayoutStore` sidebar collapse persist | ✅ Complete | 2026-06-08 | localStorage persist; unit tests |
| DA-03 | `AppSidebar` expanded/collapsed + mobile drawer | ✅ Complete | 2026-06-08 | Collapsed icons + `title` tooltips via `ShellNavLink` |
| DA-04 | `AppNavbar` full-width + collapse toggle | ✅ Complete | 2026-06-08 | Breadcrumbs, LIVE, datetime, theme, profile |
| DA-05 | `AppAside` shell right rail + `AsideSlotProvider` | ✅ Complete | 2026-06-08 | xl+ visible; placeholder until PG-* |
| DA-06 | `DashboardShell` composer | ✅ Complete | 2026-06-08 | `office` + `field` profiles |
| DA-07 | Migrate `OfficeShell` → `DashboardShell` | ✅ Complete | 2026-06-08 | Thin wrapper |
| DA-08 | Migrate `CollectorShell` → `DashboardShell` field | ✅ Complete | 2026-06-08 | Bottom nav + offline wrapper preserved |
| DA-09 | Shell E2E/a11y updates | ✅ Complete | 2026-06-08 | `e2e/shell-navbar.spec.ts`; collapse toggle + `#app-aside` helpers |
| DA-10 | NB-* navbar features (search, notifications) | ✅ Complete | 2026-06-08 | GS-01 omnibar, NF-03 inbox, connection chip, app lock, profile menu |
| DA-11 | Global contextual `AppAside` on all office routes | ✅ Complete | 2026-06-10 | All 12 sidebar routes — query-aware nav, URL-synced Applications filter — `docs/archive/page-validation/sidebar-audit.md` |

### Page Reference Compliance (PG)

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| PG-01 | `/dashboard` reference compliance | ✅ **Complete** | 2026-06-08 | All P0–P2 resolved — `docs/archive/page-validation/PG-01-dashboard-closure.md` |
| PG-02 | `/groups` reference compliance | ✅ **Complete** | 2026-06-09 | All R01–R16 resolved — `docs/archive/page-validation/PG-02-groups-closure.md` |
| PG-03 | `/collectors` reference compliance | ✅ **Complete** | 2026-06-08 | All R01–R15 resolved — `docs/archive/page-validation/PG-03-collectors-closure.md` |
| PG-04 | `/loan-pools` reference compliance | ✅ **Complete** | 2026-06-09 | R01–R11 — `docs/archive/page-validation/PG-04-loan-pools-closure.md` |
| PG-05 | `/risk-flags` reference compliance | ✅ **Complete** | 2026-06-09 | R01–R11 — `docs/archive/page-validation/PG-05-risk-flags-closure.md` |
| PG-06 | `/settings` reference compliance | ✅ **Complete** | 2026-06-09 | R01–R11 — `docs/archive/page-validation/PG-06-settings-closure.md` |

#### PG-01 — Super Admin Dashboard (`/dashboard`)

| Field | Value |
|---|---|
| Status | ✅ **COMPLETE** |
| Reference image | ✅ `context/design-references/WILMSSuperAdminDashboard.jpeg` — validated 2026-06-08 |
| Closure record | ✅ `context/docs/archive/page-validation/PG-01-dashboard-closure.md` |
| Gap analysis | ✅ `context/docs/archive/page-validation/PG-01-dashboard-gap-analysis.md` — image-authoritative |

**Prior remediation (R00–R05)**

| ID | Item | Status |
|---|---|---|
| PG-01-R00 | Reference image ingestion + validation pass | ✅ Resolved |
| PG-01-R01 | Responsive aside fallback below `xl` | ✅ Implemented — re-audit pending (R43) |
| PG-01-R02 | Executive collector table | ✅ Implemented |
| PG-01-R03 | Per-collector metrics | ✅ Implemented |
| PG-01-R04 | Alert timestamps | ✅ Implemented — right-aligned clock + category metadata |
| PG-01-R05 | Expand demo dataset | ✅ Resolved — `dashboard-demo.factory` at reference scale |

**P0 remediation (R21, R22/R26/R41, R30, R42)**

| ID | Item | Status |
|---|---|---|
| PG-01-R21 | Pending borrower segment | ✅ Resolved — 5 segments incl. Pending |
| PG-01-R22 | Reference-scale borrowers (2,714) | ✅ Resolved — seeded factory |
| PG-01-R26 | Reference-scale cycle snapshot | ✅ Resolved — factory targets |
| PG-01-R41 | Reference-scale KPI amounts | ✅ Resolved — GHS 4.82M / 3.61M / 2.98M / 633K |
| PG-01-R30 | Expanded alert system (12 categories) | ✅ Resolved — severity, icon, category, entityRef, href |
| PG-01-R42 | Dark executive theme code audit | ✅ Pass — `PG-01-R42-dark-theme-audit.md` |

**P1 remediation (R16–R33, R37, R43)**

| ID | Item | Status |
|---|---|---|
| PG-01-R16 | Home / Dashboard / Overview breadcrumbs | ✅ Resolved |
| PG-01-R17 | Super Admin Dashboard title + green LIVE badge | ✅ Resolved |
| PG-01-R18 | KPI decorative icons | ✅ Resolved |
| PG-01-R19–R20, R37 | KPI trend % + directional arrows | ✅ Resolved |
| PG-01-R23–R24 | Quick action icons + blue audit log token | ✅ Resolved — `status-info` token added |
| PG-01-R28–R29, R31–R32 | Alert clock layout, SVG icons, footer link, critical chip | ✅ Resolved |
| PG-01-R33 | Navbar bell icon + badge | ✅ Resolved |
| PG-01-R43 | Mobile aside drawer QA | ✅ E2E added |

**P2 remediation (R25, R27, R34, R35, R38–R40, R44)**

| ID | Item | Status |
|---|---|---|
| PG-01-R25 | Donut center `100 GROUPS` | ✅ Resolved |
| PG-01-R27 | Top 5 reference collector table rows | ✅ Resolved |
| PG-01-R34 | Demo persona Ama Boateng | ✅ Resolved |
| PG-01-R35 | Sidebar nav parity (no Adjustments) | ✅ Resolved |
| PG-01-R38–R40 | Borrower legend order + group risk % | ✅ Resolved |
| PG-01-R44 | Laptop sidebar collapse + aside E2E | ✅ Resolved |

**Deferred (not blocking PG-01):** DA-11 contextual aside on remaining office routes.

**Next:** PG-05 `/risk-flags` reference compliance.

#### PG-02 — Groups Management (`/groups`)

| Field | Value |
|---|---|
| Status | ✅ **COMPLETE** |
| Reference image | ✅ `context/design-references/GroupsManagement.jpeg` |
| Gap analysis | ✅ `context/docs/archive/page-validation/PG-02-groups-gap-analysis.md` |

**P0 remediation (R01–R03)**

| ID | Item | Status |
|---|---|---|
| PG-02-R01 | 148 groups at reference scale | ✅ Resolved — `groups-demo.factory` |
| PG-02-R02 | KPI values 148 / 2,416 / 19 / 84.2% | ✅ Resolved — `groups-reference-scale.ts` |
| PG-02-R03 | Risk distribution 101 / 31 / 11 / 5 | ✅ Resolved — factory risk buckets |

**P1 remediation (R04–R12)**

| ID | Item | Status |
|---|---|---|
| PG-02-R04 | KPI decorative icons | ✅ Resolved — `GroupsKpiIcon` |
| PG-02-R05 | Breadcrumbs + page title | ✅ Resolved — shell breadcrumbs + navbar h1 |
| PG-02-R06 | Gold + New Group CTA | ✅ Resolved |
| PG-02-R07 | GRP-0041 gold ID styling | ✅ Resolved |
| PG-02-R08 | Aside outstanding + financial grid | ✅ Resolved — `GroupsAsidePanel` |
| PG-02-R09 | Member avatar stack | ✅ Resolved — up to 9 avatars |
| PG-02-R10 | Rate colour bands | ✅ Resolved — `collectorRateTextClass` |
| PG-02-R11 | Recent activity timestamps | ✅ Resolved — factory activity feed |
| PG-02-R12 | Featured GRP-0041 pinned first | ✅ Resolved |

**P2 remediation (R13–R16)**

| ID | Item | Status |
|---|---|---|
| PG-02-R13 | Executive row selection chrome | ✅ Resolved — `DataTable` gold border |
| PG-02-R14 | Export download icon | ✅ Resolved — `ExportDownloadIcon` |
| PG-02-R15 | Pagination 8 rows / 19 pages | ✅ Resolved — `GROUPS_REFERENCE_PAGE_SIZE` |
| PG-02-R16 | Mobile aside drawer E2E | ✅ Resolved — `shell-navbar.spec.ts` |

**Closure:** `docs/archive/page-validation/PG-02-groups-closure.md`

#### PG-03 — Collectors Management (`/collectors`)

| Field | Value |
|---|---|
| Status | ✅ **COMPLETE** |
| Reference image | ✅ `context/design-references/CollectorsManagement.jpeg` |
| Gap analysis | ✅ `context/docs/archive/page-validation/PG-02-collectors-gap-analysis.md` |

**P0 remediation (R01–R03)**

| ID | Item | Status |
|---|---|---|
| PG-02-R01 | 34 collectors at reference scale | ✅ Resolved — `collectors-demo.factory` |
| PG-02-R02 | KPI values 34 / 84.2% / 6 / 28 | ✅ Resolved — pre-tuned rates + summary |
| PG-02-R03 | Team rate distribution 14 / 14 / 6 | ✅ Resolved — factory distribution |

**P1 remediation (R04–R12)**

| ID | Item | Status |
|---|---|---|
| PG-02-R04 | KPI decorative icons | ✅ Resolved — `CollectorsKpiIcon` |
| PG-02-R05 | Breadcrumbs + page title | ✅ Resolved — shell breadcrumbs + navbar h1 |
| PG-02-R06 | Gold + Add Collector CTA | ✅ Resolved |
| PG-02-R07 | COL-011 gold ID styling | ✅ Resolved |
| PG-02-R08 | Streak fire icon | ✅ Resolved — `CollectorStreakIcon` |
| PG-02-R09 | Aside profile fields | ✅ Resolved — `CollectorsAsidePanel` |
| PG-02-R10 | 6-month performance card | ✅ Resolved — separate card + colour bars |
| PG-02-R11 | Alert icons + timestamps | ✅ Resolved |
| PG-02-R12 | Rate colour bands | ✅ Resolved — `collector-rate-display` |

**P2 remediation (R13–R15)**

| ID | Item | Status |
|---|---|---|
| PG-02-R13 | Executive row selection chrome | ✅ Resolved — `DataTable` gold border |
| PG-02-R14 | Export download icon | ✅ Resolved — `ExportDownloadIcon` |
| PG-02-R15 | Mobile aside drawer E2E | ✅ Resolved — `shell-navbar.spec.ts` |

**Closure:** `docs/archive/page-validation/PG-03-collectors-closure.md`

### Authentication

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| A-01 | Login page + form validation | ✅ Complete | 2026-06-06 | LoginForm (RHF + Zod), POST /api/auth/login, httpOnly session cookie, demo accounts, safe redirect; 11 auth tests |
| A-02 | Session expiry handling + redirect | ✅ Complete | 2026-06-06 | Middleware expired→/session-expired; SessionExpiryHandler; apiClient 401 hook; POST /api/auth/logout; offline queue preserved; 8 new tests |
| A-03 | Role-based shell layouts (4 shells) | ✅ Complete | 2026-06-06 | OfficeShell shared by Super Admin/Officer/Approver; executive sidebar + gold nav; Collector bottom nav + offline shell; theme toggle on all shells; 5 layout tests |
| A-04 | Logout control in all role shells | ✅ Complete | 2026-06-06 | useLogout + LogoutButton + ShellUserPanel; POST /api/auth/logout + clearSession + redirect /login; wired in all 4 shells; 5 tests |

### Borrower Registration

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| BR-01 | Multi-step registration form (5 steps + review) | ✅ Complete | 2026-06-06 | 6-step wizard (personal, address, business, guarantor, photo, review); FormField, MultiStepForm, PhotoUploadField; Zod + RHF; registerBorrower service; 6 tests |
| BR-02 | Async duplicate/conflict detection (phone, ID, name fuzzy, active loan, blacklist) | ✅ Complete | 2026-06-06 | checkPhone/checkId/checkName/checkActiveLoan/checkBlacklist on IBorrowerService; registry-backed mock; async RHF validators on Step 1; submit-time conflict report + RegistrationConflictAlerts; Levenshtein ≤2 fuzzy names; 13 tests |
| BR-03 | Photo upload component (mobile camera + file picker) | ✅ Complete | 2026-06-06 | PhotoUpload with capture=user camera input, file-picker fallback, preview + remove, validateBorrowerPhoto util; PhotoUploadField RHF wrapper; 9 tests |
| BR-04 | Registration Officer borrower list view | ✅ Complete | 2026-06-06 | `/officer/my-registrations`; QueryProvider + useMyRegistrations; listMyRegistrations service; StatusBadge + DataTable; search/status filters; registeredByOfficerId on registry; 8 tests |

### Approval Workflow

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| AW-01 | Pending applications queue (Approver) | ✅ Complete | 2026-06-06 | `/approver/pending`; listPendingApplications (GET /borrowers?status=PENDING); PendingApplicationsQueue + usePendingApplications; StatusBadge + DataTable + Review links; placeholder `[id]` page; 4 tests |
| AW-02 | Borrower profile review + Approve/Reject/Blacklist actions | ✅ Complete | 2026-06-06 | `/approver/pending/[id]`; getBorrowerReview + approve/reject/blacklist PATCH endpoints; BorrowerReviewProfile + ApprovalDecisionModal + PendingApplicationReview; registry profile storage; redirect to next pending; 10 tests |
| AW-03 | Approval action audit logging | ✅ Complete | 2026-06-06 | auditService.createEntry (POST /audit); immutable mock audit-log store; useApprovalActions logs approve/reject/blacklist with actor, timestamp, reason; REQ-018; 4 tests |
| AW-04 | Reviewed applications history page | ✅ Complete | 2026-06-07 | `/approver/reviewed`; `ReviewedApplicationsPanel`; audit-backed `listReviewedApplications`; 1 test |

### Admin Fee

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| AF-01 | Admin fee recording (Collector) + disbursement gate enforcement | ✅ Complete | 2026-06-06 | `/collector/admin-fee`; transactionService.recordAdminFee (POST /transactions/admin-fee); ADMIN_FEE ledger type; collector auto-recorded; loanService disbursement gate; CurrencyAmount; 9 tests |

### Loan Management

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| LM-01 | Create loan form (amount, duration, payment day, start date, cycle/batch) | ✅ Complete | 2026-06-06 | `/loans/new` 4-step wizard (borrower, amount, schedule, preview); createLoan + listEligibleBorrowers; admin-fee gate; weekly payment calc; REQ-026/027; 7 tests |
| LM-02 | Automatic weekly schedule generation (Week 1 → N) | ✅ Complete | 2026-06-06 | generateLoanSchedule util; schedule on createLoan; getLoanSchedule (GET /loans/[id]/schedule); LoanScheduleTable; preview + /loans/[id]; REQ-040; 4 tests |
| LM-03 | Loan portfolio view (all active loans, filters, balances) | ✅ Complete | 2026-06-06 | `/loans`; listPortfolioEntries; StatCard summary; status/cycle/search filters; LoanStatusBadge; outstanding balances; REQ-037/038 partial; 5 tests |
| LM-04 | Borrower profile page (loan history, schedule, metrics) | ✅ Complete | 2026-06-06 | `/borrowers`, `/borrowers/[id]`; BorrowerList + BorrowerProfilePanel; listBorrowerLoans; loan history table; 4 tests |
| LM-05 | Real-time loan progress metrics display | ✅ Complete | 2026-06-06 | calculateLoanProgress; getLoanProgress; LoanProgressMetrics; transaction-derived balances; REQ-037/038/043; 4 tests |
| LM-06 | Borrower active loan detail + payment log | ✅ Complete | 2026-06-06 | `/borrowers/[id]/loan`; BorrowerLoanDetailPanel; schedule + payment log + metrics; listLoanPaymentLog; 2 tests |

### Payment Collection

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| PC-01 | Collector dashboard (today's borrowers, expected vs collected) | ✅ Complete | 2026-06-06 | `/collector/dashboard`; collectorService.getDashboard; expected/collected StatCards; today's borrowers table; missed alerts; reconciliation status; REQ-075; 6 tests |
| PC-02 | Payment entry form (amount validation, oldest-first logic, GPS capture) | ✅ Complete | 2026-06-06 | `/collector/payment/[id]`; PaymentEntryPanel; getPaymentEntryContext; oldest-first schedule apply; GPS blocks submit; REQ-028/029/030/031/033/052; 8 tests |
| PC-03 | Missed payment auto-marking + arrears carry-forward | ✅ Complete | 2026-06-06 | applyMissedWeekAutoMarking; sync on schedule read; arrears in payment entry; REQ-032; 2 tests |
| PC-04 | Same-day edit with audit log + Supervisor alert | ✅ Complete | 2026-06-06 | `editPayment`; `PaymentEditSection`; `isPaymentEditable`; audit `PAYMENT_EDITED`; supervisor alert; REQ-034/051 |
| PC-05 | Offline payment capture + sync | ✅ Complete | 2026-06-06 | `useRecordPaymentOrQueue`; offline GPS + queue; `Save for sync` UI; periodic retry; REQ-069/084; 3 tests |
| PC-06 | Duplicate transaction detection and blocking | ✅ Complete | 2026-06-07 | Mock service blocks duplicates; dedicated alert UX in PaymentEntryPanel; constants/payment-errors.ts; 3 tests |
| PC-07 | Group collection sheet + mark-missed + SMS enrichment | ✅ Complete | 2026-08-04 | `GroupCollectionSheet` batch record/missed via APIs; `POST /payments/missed`; dashboard `groupId`/status; disbursement schedule + paid/missed SMS balance/weeks; hero tiles link to my-borrowers status filter |

### Reconciliation

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| RC-01 | Daily reconciliation form (Expected / Collected / Physical Cash / Variance) | ✅ Complete | 2026-08-04 | `/collector/reconciliation`; expected from active loans due that weekday; Idempotency-Key submit; form reopens for REJECTED/REOPENED |
| RC-02 | Variance flagging + Super Admin notification | ✅ Complete | 2026-06-06 | 10% threshold (AMB-004); `isVarianceAboveThreshold`; supervisor alert + audit on submit; REQ-048 |

### Group Management

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| GM-01 | Group list view with risk levels | ✅ Complete | 2026-06-06 | `/groups`; `groupService`; `GroupsManagementPanel`; risk filters + detail sidebar |
| GM-02 | Group profile (members, leader, risk history) | ✅ Complete | 2026-06-06 | `/groups/[id]`; `GroupProfilePanel`; members + risk history tables; REQ-023 |
| GM-03 | Automatic group risk level calculation | ✅ Complete | 2026-06-06 | `calculateGroupRiskLevel`; `buildGroupSummaries`; thresholds in `constants/group-risk.ts`; REQ-025; 5 tests |
| GM-04 | Full Group Details + Borrower Profile workflows | ✅ Complete | 2026-06-09 | `/groups/[id]`, `/borrowers/[id]`; leader/collector/members; payments; exports; aside; audit — `docs/archive/page-validation/GM-04-group-details-closure.md` |

### Defaulter Tracking

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| DT-01 | Borrower status auto-escalation (Active → At Risk → Defaulted) | ✅ Complete | 2026-06-07 | `BORROWER_STATUS.AT_RISK`/`DEFAULTED`; `resolveBorrowerRepaymentStatus`; `borrower-escalation.sync` on schedule sync + payment |
| DT-02 | Guarantor notification trigger on Defaulted status | ✅ Complete | 2026-06-07 | `GUARANTOR_ALERT` + `DEFAULTER_STATUS` SMS/email on default transition; supervisor alert |
| DT-03 | Defaulter report view | ✅ Complete | 2026-06-07 | `/reports/defaulters`; `DefaulterReportPanel` |

### Adjustments

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| ADJ-01 | Adjustment request creation + Super Admin approval workflow | ✅ Complete | 2026-06-07 | Locked payment → `PaymentEditSection` request form; `createAdjustment` service + audit `ADJUSTMENT_REQUESTED`; approve/reject + ledger txn |
| ADJ-02 | Write-off adjustment + automatic blacklist trigger | ✅ Complete | 2026-06-07 | WRITE_OFF approval blacklists borrower + WRITTEN_OFF loan status; 3 adjustment service tests |

### Notifications

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| NF-01 | SMS/Email notification service abstraction | ✅ Complete | 2026-06-07 | `types/notification.ts`; `sendNotification` on `INotificationService`; mock delivery log |
| NF-02 | All 9 notification event triggers (registration, disbursement, payment, missed, etc.) | ✅ Complete | 2026-06-08 | All `NOTIFICATION_EVENT` types wired: registration approve/reject, `LOAN_DISBURSED`, payment received, `PAYMENT_REMINDER` (schedule sync), missed/at-risk, default/guarantor, supervisor, `LOAN_COMPLETED`; 4 integration tests |

### Collector Performance

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| CP-01 | Collector performance metrics display (rate, variance, edit frequency) | 🔄 In Progress | 2026-06-06 | `/collectors`; `collectorManagementService`; team rate distribution + alerts (edit frequency pending) |
| CP-02 | Collector performance report | ✅ Complete | 2026-06-07 | `/reports/collector-performance`; `CollectorPerformanceReportPanel` |

### Super Admin Dashboard & Reports

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| SA-01 | System dashboard (totals, active/at-risk/defaulted counts, group risk distribution) | ✅ Complete | 2026-06-06 | `GET /dashboard/summary` via `dashboardService`; `buildDashboardSummary()` aggregates mocks; `SuperAdminDashboard` + `GroupRiskCard`; unit tests |
| SA-02 | Loan Portfolio Report | ✅ Complete | 2026-06-06 | `/reports/loan-portfolio`; `GET /reports/loan-portfolio`; filters + CSV export; unit tests |
| SA-03 | Daily Collection Report | ✅ Complete | 2026-06-06 | `/reports/daily-collection`; `GET /reports/daily-collection`; date/collector filters + CSV export; unit tests |
| SA-07 | Loan Pools management page | ✅ Complete | 2026-06-06 | `/loan-pools`; `loanPoolService`; KPIs + utilisation table + detail sidebar |
| SA-08 | Risk & Flags management page | ✅ Complete | 2026-06-06 | `/risk-flags`; `riskFlagService`; flag table + breakdown + blacklist feed |
| SA-04 | Group Risk Report | ✅ Complete | 2026-06-07 | `/reports/group-risk`; `GroupRiskReportPanel`; CSV export |
| SA-05 | Financial Ledger Report | ✅ Complete | 2026-06-07 | `/reports/financial-ledger`; `FinancialLedgerReportPanel`; date filters + CSV |
| SA-06 | Audit Log Report | ✅ Complete | 2026-06-06 | `/reports/audit-log`; `AuditLogReportPanel`; date/user/action filters + CSV export; read-only; REQ-053/082; 1 test |

### Edge Cases

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| EC-01 | Overpayment detection and blocking | ✅ Complete | 2026-06-07 | Blocked at entry with `OVERPAYMENT` code; `OverpaymentReviewPanel` on `/risk-flags`; queue + resolve/dismiss + audit |
| EC-02 | Public holiday rescheduling (Super Admin) | 🔲 Not Started | — | BRD §16 |
| EC-03 | Borrower relocation / Collector reassignment | 🔲 Not Started | — | BRD §16 |
| EC-04 | Death of borrower — manual write-off workflow | 🔲 Not Started | — | BRD §16 |
| EC-05 | Group dissolution → Suspended state | 🔲 Not Started | — | BRD §16 |

### Platform Experience (Gap Analysis — Not Started)

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| UX-01 | Login UX upgrade (logo, branding, password toggle, remember session) | ✅ Complete | 2026-06-08 | Branded header, `PasswordField` show/hide, remember-email via `loginPreferencesStore`, theme toggle on login page; unit tests |
| UX-02 | App lock / six-digit PIN re-entry | ✅ Complete | 2026-06-08 | `appLockStore` + `PinEntryPad` + `AppLockOverlay` + `AppLockHandler`; `/collector/security`; idle + visibility lock; 5-attempt lockout → sign-out; 10 unit + 2 E2E tests |
| UX-03 | Splash, loader, session restore, offline init screens | ✅ Complete | 2026-06-08 | `WilmsSplashScreen` + `AppBootstrap` (session restore); `OfflineInitOverlay` (queue sync); `RoleGuard` uses branded splash; 5 unit + 2 E2E tests |
| UX-04 | PWA (manifest, service worker, icons, install, background sync) | ✅ Complete | 2026-06-08 | `manifest.webmanifest`, `sw.js`, icons, `ServiceWorkerRegistrar`, `PwaInstallBanner`, `requestPaymentBackgroundSync` on offline enqueue; E2E `pwa.spec.ts` |
| UM-01 | Super Admin user management (CRUD, roles, activity) | 🔲 Not Started | — | Demo accounts only |
| GS-01 | Global platform search (omnibar, cross-entity) | ✅ Complete | 2026-06-08 | `searchService` + `GlobalSearchPanel`; role-scoped results; Ctrl+K |
| REG-ENH | Registration enhancements (phone selector, GPS, signature, fingerprint abstraction) | 🔲 Not Started | — | Core wizard complete |
| OFF-ENH | My Registrations pagination, detail view, edit | 🔲 Not Started | — | List + filters only |

### Quality Assurance (Gap Analysis — Not Started)

| Unit | Description | Status | Last Updated | Notes |
|---|---|---|---|---|
| QA-01 | Playwright E2E suite (role journeys) | ✅ Complete | 2026-06-08 | 91 E2E tests; 13 spec files; responsive matrix + `e2e/shell-navbar.spec.ts`; `e2e/helpers/shell.ts` |
| QA-02 | Vitest coverage thresholds (80/75/80/80) | ✅ Complete | 2026-06-08 | `@vitest/coverage-v8`; `npm run test:coverage`; scoped to state/utils/lib/hooks/layouts/components + feature schemas; 90.32% stmts / 85.8% branches / 91.96% funcs |
| QA-03 | WCAG 2.1 AA accessibility audit | ✅ Complete | 2026-06-08 | axe Playwright on login/collector/approver; skip link, main landmarks, DataTable keyboard, focus-visible; `context/accessibility-audit.md` |
| QA-04 | `npm audit` + security review | 🔄 In Progress | 2026-06-08 | Audit run: 14 issues (3 critical, 5 high); fixes require major bumps (`next@16`, `@playwright/test@1.60`); deferred pending upgrade plan |

---

## Regression Log

| Date | Unit | What Broke | Cause | Fix Applied |
|---|---|---|---|---|
| 2026-08-06 | Prod invite / locations / expected | Accept-invitation 403; locations 500; recon Expected GH₵0; group add-member 403 | CSRF missing on invite accept; Ghana locations FS read on Vercel; stale `expected_due_pesewas` snapshot; Approver lacked add-member permission | CSRF on accept-invitation; bundled Ghana JSON imports + slug/UUID fallthrough; live expected enrichment + migration `0032_recon_expected_backfill`; Approvers can add group members |
| 2026-08-06 | Communication Center audiences | Borrowers/groups missing from compose; SMS used email | Audience resolver staff-only; send path bug | v1.6 unit — borrowers/groups/leaders audiences, preview/segments, due-today + ops alerts, quiet hours, migration `0033` |
| 2026-08-06 | Product excellence UI | Enterprise polish gap after v1.6 | Visual/UX debt across dashboards/nav/inbox | v1.6.1 UI polish — tokens, KPI sparklines, nav/search/inbox/comms UX; no financial/RBAC changes |
| — | — | — | — | — |

---

## Known Blockers

| Blocker | Impact | Awaiting |
|---|---|---|
| AMB-001: Admin fee amount not specified | Cannot build fee configuration until clarified | Business stakeholder clarification |

---

## Validation Command Status (Last Run)

| Command | Status | Last Run |
|---|---|---|
| `npm run lint` | ✅ Pass | 2026-06-07 |
| `npm run type-check` | ✅ Pass | 2026-06-07 |
| `npm run test` | ✅ Pass (308 tests) | 2026-06-08 |
| `npm run test:coverage` | ✅ Pass (80/75/80/80 thresholds) | 2026-06-08 |
| `npm run build` | ✅ Pass | 2026-06-07 |
| `npm run test:e2e` | ✅ Pass (86 tests) | 2026-06-08 |
| `npm audit` | ⚠️ 14 vulns (3 critical) — fixes need major upgrades | 2026-06-08 |
| `npm audit` | — Not Run — | — |
