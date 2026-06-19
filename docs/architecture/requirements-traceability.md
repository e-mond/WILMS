# WILMS — Requirements Traceability Matrix
> Women's Interest-Free Loan Management System | BRD v1.0 → Implementation Map

**Every requirement from the BRD must appear in this matrix.**
**No requirement may be marked Complete unless all mapped items exist and pass validation.**
Update this file as features are completed.

---

## Legend

| Status | Meaning |
|---|---|
| 🔲 Not Started | No implementation begun |
| 🔄 In Progress | Partially implemented |
| ✅ Complete | All mapped items exist and pass validation |
| ⚠️ Blocked | Blocked by ambiguity or dependency |

---

## Matrix

| Req ID | BRD Section | Requirement Description | Feature | Page / View | Component(s) | State | API / Mock Endpoint | Test(s) | Status |
|---|---|---|---|---|---|---|---|---|---|
| **BORROWER REGISTRATION** | | | | | | | | | |
| REQ-001 | §4.1 | Capture full personal details (Name, DOB, Gender, Phone, Email, Nationality, ID Type, ID Number) | Borrower Registration | `/officer/register` | `MultiStepForm`, `FormField`, `Input`, `Select` | React Hook Form (local) | `POST /borrowers` | Unit: form validation; E2E: complete registration flow | ✅ Complete |
| REQ-002 | §4.1 | Phone number must be unique across all borrowers | Borrower Registration | `/officer/register` Step 1 | `FormField`, `Input` | React Hook Form (local) | `GET /borrowers/check-phone` | Unit: Zod async validator; Integration: duplicate scenario | ✅ Complete |
| REQ-003 | §4.1 | Email is optional | Borrower Registration | `/officer/register` Step 1 | `FormField`, `Input` | — | — | Unit: optional field schema | ✅ Complete |
| REQ-004 | §4.1 | Capture full address (House, GPS, City, Region, District) | Borrower Registration | `/officer/register` Step 2 | `FormField`, `Input` | React Hook Form (local) | — | Unit: address validation | ✅ Complete |
| REQ-005 | §4.1 | Capture business information (Name, Address, Type of Work) | Borrower Registration | `/officer/register` Step 3 | `FormField`, `Input`, `Select` | — | — | Unit: business fields required | ✅ Complete |
| REQ-006 | §4.1 | Capture guarantor (Name, Phone, Relationship) — mandatory | Borrower Registration | `/officer/register` Step 4 | `FormField`, `Input` | — | — | Unit: guarantor required; guarantor phone ≠ borrower phone | ✅ Complete |
| REQ-007 | §4.1 | Passport-style photo upload — mandatory | Borrower Registration | `/officer/register` Step 5 | `PhotoUpload`, `FileUpload` | — | `POST /borrowers/photo` | Unit: file type/size validation; E2E: upload flow | ✅ Complete |
| REQ-008 | §4.2 | Block duplicate phone numbers before saving | Borrower Registration | `/officer/register` | `Alert`, `FormField` | — | `GET /borrowers/check-phone` | Integration: duplicate detection | ✅ Complete |
| REQ-009 | §4.2 | Block duplicate ID numbers (same type + number) | Borrower Registration | `/officer/register` | `Alert`, `FormField` | — | `GET /borrowers/check-id` | Integration: duplicate ID | ✅ Complete |
| REQ-010 | §4.2 | Surface near-duplicate names (fuzzy match) with prompt — not hard block | Borrower Registration | `/officer/register` | `Alert` | — | `GET /borrowers/check-name` | Unit: fuzzy match response handling | ✅ Complete |
| REQ-011 | §4.2 | Block if applicant already holds an active loan | Borrower Registration | `/officer/register` | `Alert` | — | `GET /borrowers/check-active-loan` | Integration: active loan block | ✅ Complete |
| REQ-012 | §4.2 | Block if applicant is blacklisted | Borrower Registration | `/officer/register` | `Alert` | — | `GET /borrowers/check-blacklist` | Integration: blacklist block | ✅ Complete |
| REQ-013 | §4.2 | Log all flagged registration attempts | Borrower Registration | — | — | — | `POST /audit/registration-flag` | Integration: audit entry created | 🔲 |
| **VERIFICATION & APPROVAL** | | | | | | | | | |
| REQ-014 | §5.1 | Pending state after registration | Approval Workflow | `/approver/pending` | `StatusBadge`, `DataTable` | TanStack Query | `GET /borrowers?status=PENDING` | Unit: status rendering | ✅ Complete |
| REQ-015 | §5.1 | Approver can Approve borrower | Approval Workflow | `/approver/pending/[id]` | `Button`, `Modal` | TanStack Query mutation | `PATCH /borrowers/[id]/approve` | Integration: approve flow; E2E: approve + SMS trigger | ✅ Complete |
| REQ-016 | §5.1 | Approver can Reject borrower with logged reason | Approval Workflow | `/approver/pending/[id]` | `Button`, `Modal`, `Textarea` | TanStack Query mutation | `PATCH /borrowers/[id]/reject` | Integration: reject flow | ✅ Complete |
| REQ-017 | §5.1 | Approver can Blacklist borrower with logged reason | Approval Workflow | `/approver/pending/[id]` | `Button`, `Modal`, `Textarea` | TanStack Query mutation | `PATCH /borrowers/[id]/blacklist` | Integration: blacklist flow | ✅ Complete |
| REQ-018 | §5.1 | All approval actions permanently logged (user, timestamp, reason) | Approval Workflow | Audit Log | — | authStore (actor) | `POST /audit` | Integration: audit record created for each action | ✅ Complete |
| **ADMIN FEE** | | | | | | | | | |
| REQ-019 | §6 | Admin fee must be paid before loan disbursement | Admin Fee | `/collector/admin-fee`, loan disbursement | `Alert`, `Button`, `DisbursementGateAlert` | TanStack Query | `POST /transactions/admin-fee` | Integration: disbursement blocked without fee | ✅ Complete |
| REQ-020 | §6 | Collector's name auto-recorded against fee transaction | Admin Fee | `/collector/admin-fee/[borrowerId]` | `AdminFeeRecordingPanel` | authStore (current user) | `POST /transactions/admin-fee` | Integration: fee transaction includes collector ID | ✅ Complete |
| REQ-021 | §6 | Fee logged as Admin Fee transaction type in ledger | Admin Fee | Financial Ledger Report | `TransactionLog` | — | `POST /transactions/admin-fee` | Integration: transaction type = ADMIN_FEE | ✅ Complete |
| **GROUP STRUCTURE** | | | | | | | | | |
| REQ-022 | §7.1 | All borrowers organised into groups within communities | Group Management | `/groups`, `/groups/[id]` | `GroupsManagementPanel`, `DataTable`, `GroupRiskBadge` | TanStack Query (`useGroups`) | `GET /groups` | Unit: group rendering | ✅ Complete |
| REQ-023 | §7.1 | Each group has an elected group leader | Group Management | `/groups/[id]` | `GroupProfilePanel` | TanStack Query (`useGroup`) | `GET /groups/[id]` | Unit: leader field rendering | ✅ Complete |
| REQ-024 | §7.1 | Joint liability — group covers member shortfalls | Group Management | — | Alert, notification | — | — | Integration: group flagged on member default | 🔲 |
| REQ-025 | §7.2 | Automatic group risk level: Low Risk, At Risk, Flagged, Suspended | Group Management | `/groups`, `/groups/[id]` | `GroupRiskBadge`, risk distribution sidebar | TanStack Query (`useGroups`) | `GET /groups/[id]` | Unit: risk level badge rendering per trigger | ✅ Complete |
| **LOAN STRUCTURE** | | | | | | | | | |
| REQ-026 | §8.1 | Create loan with: Amount, Duration (weeks), Payment Day, Cycle/Batch, Start Date | Loan Management | `/loans/new` | `CreateLoanWizard`, `LoanPreview`, `MultiStepForm` | React Hook Form | `POST /loans` | Unit: loan form validation; Integration: loan created | ✅ Complete |
| REQ-027 | §8.1 | Weekly Payment = Loan Amount ÷ Duration (no interest) | Loan Management | `/loans/new`, `/borrowers/[id]/loan` | `LoanPreview`, `CurrencyAmount` | — | — | Unit: weekly amount calculation | ✅ Complete |
| **PAYMENT RULES** | | | | | | | | | |
| REQ-028 | §9.1 | All payments weekly on assigned payment day | Payment Collection | `/collector/payment/[id]` | `PaymentEntryPanel` | TanStack Query | `GET /borrowers/[id]/payment-entry` | Unit: payment day enforcement | ✅ Complete |
| REQ-029 | §9.1 | Full weekly amount only — no partial payments | Payment Collection | `/collector/payment/[id]` | `PaymentEntryPanel` | TanStack Query | `POST /payments` | Unit: amount validation blocks partial | ✅ Complete |
| REQ-030 | §9.1 | No advance payments | Payment Collection | `/collector/payment/[id]` | `PaymentEntryPanel` | TanStack Query | — | Unit: advance payment blocked | ✅ Complete |
| REQ-031 | §9.1 | Payments always clear oldest unpaid obligation first | Payment Collection | `/collector/payment/[id]` | `PaymentEntryPanel` | TanStack Query | `POST /payments` | Unit: oldest-first application logic | ✅ Complete |
| REQ-032 | §9.2 | Missed weeks auto-marked Missed | Automated Tracking | `/loans/[id]`, `/collector/payment/[id]` | `LoanScheduleTable`, `PaymentEntryPanel` | TanStack Query | — | Integration: missed week detection | ✅ Complete |
| REQ-033 | §9.2 | Next required payment = current week + all outstanding arrears | Payment Collection | `/collector/payment/[id]` | `PaymentEntryPanel` | TanStack Query | `GET /borrowers/[id]/payment-entry` | Unit: arrears accumulation calculation | ✅ Complete |
| REQ-034 | §9.3 | Same-day corrections permitted for Collectors only | Payment Collection | `/collector/payment/[id]` | `PaymentEditSection` | authStore (`useAuth`) | `PATCH /payments/[id]` | Integration: edit allowed same-day; blocked after | ✅ Complete |
| REQ-035 | §9.3 | All edits logged (timestamp, user, reason) | Payment Collection | Audit Log | — | — | `POST /audit` | Integration: audit entry on edit | ✅ Complete |
| REQ-036 | §9.3 | Locked records corrected only via Adjustment (Super Admin approval) | Adjustments | `/adjustments`, collector payment entry | `AdjustmentsPanel`, `AdjustmentReviewModal`, `PaymentEditSection` | TanStack Query | `POST /adjustments`, `POST /adjustments/{id}/approve` | Integration: create + approve/reject; E2E pending | 🔄 |
| **AUTOMATED TRACKING** | | | | | | | | | |
| REQ-037 | §10.1 | Total Paid = sum of all confirmed repayments | Loan Management | `/borrowers/[id]/loan`, `/loans/[id]` | `LoanProgressMetrics`, `StatCard` | TanStack Query | `GET /loans/[id]/progress` | Unit: balance derived from transactions | ✅ Complete |
| REQ-038 | §10.1 | Remaining Balance = Loan Amount − Total Paid | Loan Management | `/borrowers/[id]/loan`, `/loans/[id]` | `LoanProgressMetrics`, `StatCard` | TanStack Query | — | Unit: balance calculation | ✅ Complete |
| REQ-039 | §10.1 | Overpayment flagged and queued for review | Payment Collection, Risk & Flags | `/collector/payment/[id]`, `/risk-flags` | `Alert`, `PaymentEntryPanel`, `OverpaymentReviewPanel` | TanStack Query | `POST /overpayment-reviews` | Integration: queue on block + Super Admin resolve; E2E pending | 🔄 |
| REQ-040 | §10.2 | System generates complete weekly schedule at loan creation | Loan Management | `/loans/[id]`, `/borrowers/[id]/loan`, `/loans/new` | `LoanScheduleTable`, `LoanPreview`, `LoanDetailPanel`, `BorrowerLoanDetailPanel` | TanStack Query | `GET /loans/[id]/schedule` | Integration: schedule generated on loan create | ✅ Complete |
| REQ-041 | §10.3 | Borrower → At Risk after 1 missed payment | Defaulter Tracking | `/borrowers/[id]`, `/reports/defaulters` | `StatusBadge` | TanStack Query | — | `BORROWER_STATUS.AT_RISK` via `borrower-escalation.sync`; E2E pending | 🔄 |
| REQ-042 | §10.3 | Borrower → Defaulted after 2+ consecutive missed payments; Supervisor escalated; Guarantor notified | Defaulter Tracking | `/borrowers/[id]`, `/reports/defaulters` | `StatusBadge`, notification | notificationService | `POST /notifications`, guarantor SMS | Borrower + loan DEFAULTED + guarantor/supervisor alerts; E2E pending | 🔄 |
| REQ-043 | §10.4 | Display: % repaid, weeks completed/remaining, payment consistency score, total missed | Loan Management | `/borrowers/[id]/loan`, `/loans/[id]` | `LoanProgressMetrics`, `StatCard`, `ProgressBar` | TanStack Query | `GET /loans/[id]/progress` | Unit: metric calculations | ✅ Complete |
| **FINANCIAL SYSTEM** | | | | | | | | | |
| REQ-044 | §11.1 | Every financial movement recorded as a transaction — no manual balance entries | All Financial Features | All financial views | `TransactionLog` | TanStack Query | All financial endpoints | Integration: no balance field mutated directly | 🔲 |
| REQ-045 | §11.2 | Transaction types: Disbursement, Repayment, Admin Fee, Withdrawal, Adjustment | Financial Reports | `/reports/financial-ledger` | `TransactionLog`, `Badge` | TanStack Query | `GET /transactions` | Unit: all type badges rendered correctly | 🔲 |
| REQ-046 | §11.2 | Withdrawal recorded by Super Admin only | Financial System | — | Role-gated action | authStore | `POST /transactions/withdrawal` | Integration: Collector cannot record withdrawal | 🔲 |
| **DAILY RECONCILIATION** | | | | | | | | | |
| REQ-047 | §12 | Reconciliation captures: Expected, Collected, Physical Cash, Variance | Reconciliation | `/collector/reconciliation` | `ReconciliationForm` | TanStack Query + Zod | `POST /reconciliations` | Unit: form validation; Integration: reconciliation saved | ✅ Complete |
| REQ-048 | §12 | Variance above threshold triggers Super Admin review | Reconciliation | — | `Alert`, notification | — | `POST /notifications/supervisor` | Integration: threshold alert | ✅ Complete |
| **FRAUD PREVENTION** | | | | | | | | | |
| REQ-049 | §13.1 | Mandatory daily reconciliation (physical cash vs system) | Reconciliation | `/collector/reconciliation` | `ReconciliationForm` | — | — | E2E: reconciliation required at end of day | ✅ Complete |
| REQ-050 | §13.1 | Borrower SMS receipts confirm every payment | Notifications | — | — | — | `POST /notifications/sms` | Integration: SMS triggered on payment record | 🔲 |
| REQ-051 | §13.1 | All same-day edits timestamped, audit-logged, Supervisor notified | Payment Collection | Audit Log | `PaymentEditSection` | auditService + notificationService | `POST /audit`, supervisor alert | Integration: edit audit + supervisor alert | ✅ Complete |
| REQ-052 | §13.2 | GPS coordinates + timestamps auto-captured for every field payment | Payment Collection | `/collector/payment/[id]` | `PaymentEntryPanel` | — | Included in `POST /payments` | Integration: GPS field present in payment record | ✅ Complete |
| REQ-053 | §13.2 | Audit log is immutable — no records can be deleted | Audit Log | `/reports/audit-log` | `AuditLogReportPanel`, `DataTable` | TanStack Query | `GET /audit-log` (read-only) | Integration: no delete endpoint; read-only UI | ✅ Complete |
| **SMS & EMAIL** | | | | | | | | | |
| REQ-054 | §14.2 | Registration Approved → SMS + Email | Notifications | Triggered on approval action | — | `POST /notifications` | Integration: `sendNotification` on approve | ✅ Complete |
| REQ-055 | §14.2 | Registration Rejected → SMS | Notifications | Triggered on rejection | — | `POST /notifications` | Integration: `sendNotification` on reject | ✅ Complete |
| REQ-056 | §14.2 | Loan Disbursed → SMS + Email | Notifications | Triggered on disbursement | — | `POST /notifications` | Integration: `LOAN_DISBURSED` on `disburseLoan` | ✅ Complete |
| REQ-057 | §14.2 | Payment Received → SMS (within 60 seconds) | Notifications | Triggered on payment record | — | `POST /notifications` | Integration: SMS on `recordPayment` | ✅ Complete |
| REQ-058 | §14.2 | Payment Reminder → SMS | Notifications | Triggered by scheduler before payment day | — | `POST /notifications` | Integration: `syncPaymentReminders` on schedule read | ✅ Complete |
| REQ-059 | §14.2 | Missed Payment → SMS | Notifications | Triggered on missed week | — | `POST /notifications` | Integration: SMS on AT_RISK escalation | ✅ Complete |
| REQ-060 | §14.2 | Defaulter Status → SMS + Email | Notifications | Triggered on Defaulted status | — | `POST /notifications` | Integration: SMS+email on DEFAULTED escalation | ✅ Complete |
| REQ-061 | §14.2 | Loan Completed → SMS + Email | Notifications | Triggered on final payment | — | `POST /notifications` | Integration: `LOAN_COMPLETED` on final repayment | ✅ Complete |
| REQ-062 | §14.2 | Guarantor Alert → SMS on missed payment (at Defaulted trigger) | Notifications | Triggered on Defaulted status | — | `POST /notifications/guarantor` | Integration: `GUARANTOR_ALERT` on default transition | ✅ Complete |
| **COLLECTOR PERFORMANCE** | | | | | | | | | |
| REQ-063 | §15 | Display: Expected Collections, Actual Collections, Collection Rate, Missed Borrowers, Reconciliation Variance, Edit Frequency | Collector Performance | `/collectors/[id]`, `/reports/collector-performance` | `CollectorProfilePanel`, `CollectorsManagementPanel` | TanStack Query | `GET /collectors/[id]` | Partial metrics; **edit frequency + daily log pending** | 🔄 |
| **EDGE CASES** | | | | | | | | | |
| REQ-064 | §16 | Death of borrower — flag loan, notify guarantor, Super Admin manual review for write-off | Edge Cases | `/borrowers/[id]` | Supervisor action + `Alert` | — | `PATCH /borrowers/[id]/flag-deceased` | Integration: deceased flag workflow | 🔲 |
| REQ-065 | §16 | Guarantor unreachable — flag and escalate to Super Admin | Edge Cases | Audit / admin view | `Alert` | — | — | Integration: escalation logged | 🔲 |
| REQ-066 | §16 | Overpayment → blocked by system; requires review and adjustment | Edge Cases | `/collector/payment/[id]`, `/risk-flags` | `Alert`, `PaymentEntryPanel`, `OverpaymentReviewPanel` | TanStack Query | `POST /overpayment-reviews` | Review queue complete; adjustment path via existing ADJ-01; E2E pending | 🔄 |
| REQ-067 | §16 | Public holiday rescheduling (Super Admin adjusts payment day) | Edge Cases | `/settings` or admin action | Admin form | — | `PATCH /loans/reschedule` | Integration: schedule updates on reschedule | 🔲 |
| REQ-068 | §16 | Borrower relocation — Collector updates profile; Super Admin may reassign | Edge Cases | `/borrowers/[id]` | Edit form | — | `PATCH /borrowers/[id]` | Integration: reassignment recorded | 🔲 |
| REQ-069 | §16 | System downtime — offline mode captures locally, syncs within 15 min | Offline Mode | Collector UI | `PaymentEntryPanel`, `OfflineBanner`, offline queue | Zustand offlineQueueStore + `useRecordPaymentOrQueue` | Sync on reconnect | Integration: offline queue + sync | ✅ Complete |
| REQ-070 | §16 | Duplicate transaction detection and blocking | Payment Collection | `/collector/payment/[id]` | `Alert` | — | `POST /payments` (server-side dedup) | Unit: duplicate detection; Integration: blocked | ✅ Complete |
| REQ-071 | §16 | Group dissolution → Suspended; individual loans remain | Group Management | `/groups/[id]` | `StatusBadge` | — | `PATCH /groups/[id]/dissolve` | Integration: group suspended; loans unchanged | 🔲 |
| REQ-072 | §16 | Loan write-off — Super Admin records adjustment; borrower blacklisted; audit retained | Adjustments | `/adjustments` | `AdjustmentReviewModal` | — | `POST /adjustments/{id}/approve` | Integration: write-off + blacklist trigger | ✅ Complete |
| REQ-073 | §16 | Wrong disbursement amount — locked after same day; Super Admin adjustment required | Adjustments | `/adjustments` | Adjustment workflow | — | `POST /adjustments` | Integration: disbursement correction flow | 🔲 |
| **DASHBOARDS & REPORTS** | | | | | | | | | |
| REQ-074 | §17.1 | Super Admin dashboard: pool totals, disbursed, collected, outstanding, borrower counts, collector performance, group risk | Super Admin Dashboard | `/dashboard` | `KpiCard`, `DataTable`, `GroupRiskCard`, `CurrencyAmount` | TanStack Query (`useDashboardSummary`) | `GET /dashboard/summary` | Unit: all metrics displayed; E2E: dashboard load | ✅ Complete |
| REQ-075 | §17.2 | Collector dashboard: today's borrowers, expected vs collected, missed alerts, reconciliation status | Collector Dashboard | `/collector/dashboard` | `CollectorDashboardPanel`, `StatCard`, `Alert`, `DataTable` | TanStack Query | `GET /collector/{id}/dashboard` | Unit: collector metrics; E2E: collector dashboard | ✅ Complete |
| REQ-076 | §17.3 | Loan Portfolio Report | Reports | `/reports/loan-portfolio` | `LoanPortfolioReportPanel`, `DataTable`, `ExportCsvButton`, `CurrencyAmount` | TanStack Query (`useLoanPortfolioReport`) | `GET /reports/loan-portfolio` | Unit: summary + export; integration: seed data | ✅ Complete |
| REQ-077 | §17.3 | Daily Collection Report | Reports | `/reports/daily-collection` | `DailyCollectionReportPanel`, `DataTable`, `ExportCsvButton`, `CurrencyAmount` | TanStack Query (`useDailyCollectionReport`) | `GET /reports/daily-collection` | Unit: expected vs collected; integration: seed data | ✅ Complete |
| REQ-078 | §17.3 | Defaulter Report | Reports | `/reports/defaulters` | `DefaulterReportPanel`, `DataTable` | TanStack Query | `GET /reports/defaulters` | Unit: panel renders; E2E pending | 🔄 |
| REQ-079 | §17.3 | Collector Performance Report | Reports | `/reports/collector-performance` | `CollectorPerformanceReportPanel`, `DataTable` | TanStack Query | `GET /reports/collector-performance` | Unit: panel renders; E2E pending | 🔄 |
| REQ-080 | §17.3 | Group Risk Report | Reports | `/reports/group-risk` | `GroupRiskReportPanel`, `DataTable` | TanStack Query | `GET /reports/group-risk` | Unit: panel renders; E2E pending | 🔄 |
| REQ-081 | §17.3 | Financial Ledger Report | Reports | `/reports/financial-ledger` | `FinancialLedgerReportPanel`, `DataTable` | TanStack Query | `GET /reports/financial-ledger` | Unit: panel + filters; E2E pending | 🔄 |
| REQ-082 | §17.3 | Audit Log Report | Reports | `/reports/audit-log` | `AuditLogReportPanel`, `DataTable`, `ExportCsvButton` | TanStack Query (`useAuditLogReport`) | `GET /audit-log` | Integration: all actions present; immutable | ✅ Complete |
| **NON-FUNCTIONAL** | | | | | | | | | |
| REQ-083 | §18 | Collector dashboard loads in < 2 seconds on 3G | Performance | `/collector/dashboard` | — | — | E2E: Playwright network throttle test | 🔲 |
| REQ-084 | §18 | Offline mode: data captured locally; sync within 15 min | Offline Mode | Collector UI | `PaymentEntryPanel`, `OfflineBanner` | Zustand offlineQueueStore + periodic retry | — | Integration: offline sync test | ✅ Complete |
| REQ-085 | §18 | 500 concurrent users supported | Scalability | — | — | — | Load test (backend concern; document in PERFORMANCE_AUDIT.md) | 🔲 |
| REQ-086 | §19 | RBAC — each user sees only their role's data | Security / All | All pages | Role-gated layouts | authStore | Middleware | Integration: role boundary tests for each role | 🔲 |
| REQ-087 | §19 | Sensitive fields encrypted at rest (ID, phone, GPS address) | Security | — | — | — | Not verified (backend); document assumption | ⚠️ |
| REQ-088 | §19 | Audit logs capture every read, write, delete with user identity and timestamp | Audit | All write actions | — | `POST /audit` | Integration: audit record on every mutation | 🔲 |
