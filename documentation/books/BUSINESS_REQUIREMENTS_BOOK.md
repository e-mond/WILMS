# WILMS Business Requirements Book

**Version:** 1.7.3  
**Classification:** Confidential  
**Status legend:** Complete | Partial | Planned | Deferred | Rejected

---

## 1. Programme scope

WILMS manages women's interest-free group lending programmes. Requirements trace from business need through implementation status as of platform release v1.7.2.

---

## 2. Borrower management

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-001 | Register new borrowers with personal details | Complete | Registration officer portal |
| BR-002 | Capture identity documents and photos | Complete | Upload module with allowlist |
| BR-003 | Capture signature and thumbprint modes | Complete | Registration workflow |
| BR-004 | GPS verification on registration | Complete | Location module |
| BR-005 | Pending registration queue and edit | Complete | Officer can edit pending |
| BR-006 | Borrower profile with full history | Complete | Profile page with tabs |
| BR-007 | Borrower self-service portal | Deferred | HQ-operated model; v2.5 planned |
| BR-008 | Bulk borrower import | Planned | v1.9 automation |

---

## 3. Loan lifecycle

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-010 | Loan application submission | Complete | Officer/collector initiated |
| BR-011 | Approver review with side-by-side documents | Complete | Approver portal |
| BR-012 | Approve/reject with reason | Complete | Audited decisions |
| BR-013 | Admin fee before disbursement | Complete | Enforced in financial engine |
| BR-014 | Pool hard-stop on insufficient capital | Complete | Create + disburse validation (v1.8.0 Phase 11) |
| BR-015 | Disbursement with schedule generation | Complete | Weekly repayment schedule |
| BR-016 | Loan restructuring | Partial | Manual adjustment path; automated rules planned v1.9 |
| BR-017 | Super Admin may approve/disburse loans they created | Complete | Maker-checker exception for Super Admin only (v1.8.0) |
| BR-017 | Interest calculation | Rejected | Interest-free product by design |

---

## 4. Collections and payments

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-020 | Record full weekly collection amount | Complete | No partial payments |
| BR-021 | GPS capture on field payment | Complete | Collector field shell |
| BR-022 | Same-day edit window for collectors | Complete | Immutable after day-end |
| BR-023 | Payment reversal with audit | Complete | Controlled reversal paths |
| BR-024 | Admin fee collection | Complete | Separate from loan repayment |
| BR-025 | Offline payment queue | Complete | Collector offline store |
| BR-026 | Mobile money integration | Deferred | v1.8 integrations |
| BR-027 | Bank transfer recording | Planned | v1.8 with statement import |

---

## 5. Reconciliation

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-030 | Daily collector reconciliation | Complete | Submit and review workflow |
| BR-031 | Overpayment review queue | Complete | Approver/admin resolution |
| BR-032 | Reconciliation aging on dashboard | Complete | v1.7.2 operational dashboard |
| BR-033 | Automated bank reconciliation | Deferred | v1.8 bank import |

---

## 6. Capital pools

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-040 | Pool creation and replenishment | Complete | Super admin |
| BR-041 | Pool ledger (replenishment, disbursement, repayment, adjustment) | Complete | Integer pesewas |
| BR-042 | Available balance hard-stop | Complete | Disbursement blocked |
| BR-043 | Multi-pool per organisation | Complete | Multiple pools supported |
| BR-044 | Inter-pool transfers | Planned | v2.0 multi-branch |

---

## 7. Expenses

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-050 | Field expense recording | Complete | Collector portal |
| BR-051 | HQ expense recording | Complete | Admin portal |
| BR-052 | Maker-checker expense approval | Complete | Submitter ≠ approver |
| BR-053 | Expense affect operating cash only | Complete | Not loan principal |
| BR-054 | Expense budget limits | Planned | v1.9 automation |

---

## 8. Groups and collectors

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-060 | Group formation workflow | Complete | Group formation module |
| BR-061 | Assign collector to group | Complete | Admin/approver action |
| BR-062 | Collector dashboard with assigned groups | Complete | Field shell |
| BR-063 | Collector performance metrics | Partial | Basic metrics; advanced analytics v1.9 |
| BR-064 | Approver assign borrower to group | Complete | Non-silent Assign Group (v1.8.0 Phase 11) |
| BR-065 | Operational group/collector reassignment | Complete | `/ops/reassignment` |
| BR-066 | Payment day change with schedule recalculation | Complete | Enterprise approve + recalc |

---

## 9. RBAC and security

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-070 | Five production roles | Complete | shared-rbac |
| BR-071 | Permission overrides | Complete | Admin-granted, audited |
| BR-072 | Force logout | Complete | Session invalidation |
| BR-073 | Append-only audit log | Complete | No deletion |
| BR-074 | HMAC session authentication | Complete | Not Auth.js |
| BR-075 | Multi-organisation tenancy | Deferred | v2.0 |
| BR-076 | SSO / SAML integration | Planned | v2.0 enterprise |

---

## 10. Reporting and intelligence

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-080 | Operational reports suite | Complete | Reports module |
| BR-081 | Executive intelligence dashboard | Complete | v1.7.0+ |
| BR-082 | Forecasting | Complete | Schedule-based projection |
| BR-083 | Portfolio breakdown | Complete | Region / MMDA / sub-district / electoral area / community |
| BR-088 | Ghana administrative location master | Complete | Hierarchy v2 + national localities; 16 regions; 261 MMDAs; HOTOSM named places; alias/fuzzy search; territory intelligence |
| BR-084 | Compliance pack export | Complete | Executive intelligence |
| BR-085 | Standalone Export Center | Rejected | Removed v1.7.3; contextual exports |
| BR-086 | Contextual export from reports/profiles | Complete | Primary export pattern v1.7.3 |
| BR-087 | Scheduled report delivery | Planned | v1.9 automation |

---

## 11. Notifications and communications

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-090 | In-app notifications | Complete | Notification inbox |
| BR-091 | Email notifications | Complete | Transactional email |
| BR-092 | SMS notifications | Complete | Provider-configured |
| BR-093 | Notification deduplication | Complete | Dispatch layer |
| BR-094 | Quiet hours | Complete | Organisation settings |
| BR-095 | Communications center | Complete | Templates, broadcasts, threads |
| BR-096 | Borrower lifecycle SMS/email | Complete | Registration through delinquency ladder (v1.8.0 Phase 11) |

---

## 12. Operations

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-100 | Health endpoint | Complete | /health |
| BR-101 | Ops incidents | Complete | v1.7.0+ |
| BR-102 | Maintenance windows | Complete | v1.7.0+ |
| BR-103 | Vercel Cron notification dispatch | Complete | Daily 06:00 UTC |
| BR-104 | Redis job queue | Deferred | Current scale sufficient |
| BR-105 | Operations reassignment console | Complete | Group, collector, payment day |

---

## 13. UI/UX

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-110 | Design system tokens | Complete | Tailwind + CSS vars |
| BR-111 | Office and field shell profiles | Complete | DashboardShell |
| BR-112 | Product Tour 2.0 | Complete | v1.7.2 |
| BR-113 | Guided onboarding | Partial | Foundation; full flow RC2 |
| BR-114 | Full shadcn migration | Partial | High-traffic routes done |
| BR-115 | WCAG 2.1 AA compliance | Partial | Remediations ongoing |
| BR-116 | Localized UI | Deferred | v3.0 |

---

## 14. Platform and deployment

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-120 | Vercel + Neon deployment | Complete | Production |
| BR-121 | Domain extraction monorepo | Complete | v1.5.0 |
| BR-122 | Route Handler in-process API | Complete | Default mode |
| BR-123 | Migration journal | Complete | Drizzle SQL |
| BR-124 | PWA with offline support | Complete | Collector focus |
| BR-125 | Native mobile app | Deferred | PWA sufficient |

---

## 15. Documentation (v1.7.3)

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| BR-130 | Official documentation library | Complete | v1.7.3 |
| BR-131 | Role-based user manuals | Complete | Five roles |
| BR-132 | Branded PDF/DOCX generation | Complete | docs:generate script |
| BR-133 | Static docs web portal | Planned | Structure defined; deploy pending |
| BR-134 | OpenAPI specification | Planned | v1.8 |

---

## 16. Summary statistics

| Status | Count |
|--------|-------|
| Complete | 62 |
| Partial | 6 |
| Planned | 8 |
| Deferred | 10 |
| Rejected | 2 |

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
