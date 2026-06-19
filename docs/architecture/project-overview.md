# WILMS — Project Overview
> Women's Interest-Free Loan Management System | BRD v1.0 | May 2026 | CONFIDENTIAL

---

## 1. Project Summary

WILMS is a purpose-built, role-based digital platform that replaces paper-based micro-loan management for women's community lending programs across multiple regions in Ghana. It enforces strict repayment rules, provides real-time financial tracking, supports field Collectors with a mobile-first interface, and produces accurate financial reports — eliminating manual record-keeping risks, collector fraud, and data inconsistency.

All currency is in **Ghanaian Cedis (GHS)** unless system configuration changes this.

---

## 1.1 Product Experience Vision

WILMS is designed as a modern financial operations platform focused on trust, accountability, transparency, and operational efficiency.

The interface follows a role-based experience model:

### Executive Experience
Used by:
- Super Admin
- Finance Officers
- Auditors

Characteristics:
- Data-dense dashboards
- Financial monitoring
- Risk management
- Reporting and reconciliation workflows
- Dark executive theme

### Field Experience
Used by:
- Collectors
- Registration Officers
- Approvers

Characteristics:
- Mobile-first usability
- High readability in outdoor conditions
- Simplified workflows
- Offline-first interaction patterns
- Light theme optimized for daylight use

The design language follows a flat, professional financial-system aesthetic:
- No gradients
- No drop shadows
- Minimal decoration
- Information-first layouts
- Consistent design tokens
- Full light and dark mode support

## 2. Business Goals

| # | Goal |
|---|------|
| BG-01 | Replace manual, paper-based loan management with a structured digital system |
| BG-02 | Eliminate collector fraud via reconciliation, GPS stamping, and audit logs |
| BG-03 | Provide real-time financial visibility to administrators and management |
| BG-04 | Enforce strict repayment discipline (no partial, no advance payments) |
| BG-05 | Support field Collectors operating on low-bandwidth mobile networks |
| BG-06 | Maintain an immutable audit trail for 7 years to satisfy regulatory and fiduciary obligations |
| BG-07 | Automate borrower communication (SMS primary, email supplementary) |
| BG-08 | Enable scalable management of up to 500 concurrent field users |

---

## 3. User Personas

### 3.1 Super Admin
- **Who:** Central operations manager or finance officer
- **Context:** Office-based; full desktop access
- **Goals:** System configuration, fraud oversight, financial reporting, audit review, adjustments
- **Pain Points:** Lack of real-time visibility into field collections; manual reconciliation errors
- **Key Screens:** System dashboard, audit log, financial ledger, adjustment approvals, user management

### 3.2 Collector
- **Who:** Field officer visiting borrowers weekly
- **Context:** Mobile device; 3G or intermittent connectivity; outdoor conditions
- **Goals:** Register borrowers, record payments, complete daily reconciliation
- **Pain Points:** Connectivity drops; pressure to meet collection targets; risk of being implicated in fraud
- **Key Screens:** Collector dashboard, borrower list, payment entry, reconciliation form

### 3.3 Registration Officer
- **Who:** Office or community-based intake officer
- **Context:** Mobile or desktop; moderate connectivity
- **Goals:** Register new borrowers accurately with documents and photos
- **Pain Points:** Duplicate registrations; incomplete form submissions
- **Key Screens:** Borrower registration form, own registered borrowers list

### 3.4 Approver
- **Who:** Loan officer or community coordinator
- **Context:** Mobile or desktop
- **Goals:** Review and approve or reject borrower applications; flag suspicious registrations
- **Pain Points:** Incomplete borrower profiles; difficulty detecting near-duplicates
- **Key Screens:** Pending applications queue, borrower profile review, approval/rejection form

---

## 4. Key User Journeys

### Journey 1 — Borrower Onboarding
1. Registration Officer submits borrower profile (personal, address, business, guarantor, photo)
2. System runs duplicate/conflict detection (phone, ID, name fuzzy match, active loan, blacklist)
3. If checks pass → status = **Pending**; if fail → blocked with reason displayed
4. Approver reviews profile → Approves / Rejects / Blacklists
5. If Approved → SMS + Email notification sent to borrower
6. Borrower pays admin fee → Collector records Admin Fee transaction
7. Loan disbursement unlocked → Super Admin or Collector disburses

### Journey 2 — Weekly Loan Repayment
1. System generates weekly schedule at loan creation (Week 1 → Week N, fixed amount, fixed day)
2. Collector visits borrower on payment day
3. Collector records payment → GPS + timestamp automatically captured
4. System validates: full amount only, oldest obligation first, no advance payments
5. SMS receipt sent to borrower within 60 seconds
6. If missed → week auto-marked Missed; arrears carried forward; next required amount updated

### Journey 3 — Daily Reconciliation
1. End of each collection day, Collector enters Physical Cash amount
2. System compares: Expected Total vs Collected Total vs Physical Cash
3. Variance flagged → Super Admin notified if above threshold
4. Reconciliation locked once submitted

### Journey 4 — Default Escalation
1. 1 missed payment → Borrower status = **At Risk**; Collector alerted
2. 2+ consecutive missed payments → **Defaulted**; Super Admin escalated; Guarantor SMS sent
3. Court/recovery action or voluntary Admin action → **Blacklisted**
4. Write-off: Super Admin records Adjustment; borrower blacklisted; audit trail retained

### Journey 5 — Reporting & Audit
1. Super Admin selects report type and date range
2. System generates from transaction ledger (no manual balance entries)
3. Audit log viewable by Super Admin; immutable; 7-year retention

---

## 5. Out of Scope (Phase 1)
- Interest-bearing loan products
- Borrower-facing self-service portal (Phase 2)
- Direct bank / mobile money integrations (Phase 2)

---

## 6. Assumptions
- Collectors have smartphones with data or periodic WiFi
- SMS gateway provider (e.g., Hubtel, Arkesel) contracted before go-live
- Super Admin configures loan rules, cycles, and community structures before first disbursement
- Borrowers have reachable phone numbers for SMS
- All financial figures in GHS
- Mobile device GPS is available for field transactions

---

## 7. Key Dependencies

| Dependency | Notes |
|---|---|
| BRD Document | `WILMS_BRD_v1.0.pdf` at project root is the authoritative business source. If unavailable, use `context/requirements-traceability.md` and this file as working substitutes. |
| SMS Gateway | Hubtel, Arkesel, or equivalent — required before go-live |
| Email Service | SendGrid or equivalent — supplementary channel |
| Mobile GPS | Required for field transaction location stamping |
| Cloud Hosting | 99.5% uptime SLA required |

---
## Frontend Invariants

The frontend must never violate the following rules:

1. Never hardcode colors in components.
2. Never hardcode typography scales.
3. Never use inline styling for visual design.
4. Always consume design tokens.
5. Every screen must support both light and dark mode.
6. Status colors must be driven by semantic status tokens.
7. Dashboard layouts must follow approved WILMS dashboard patterns.

## 8. Non-Functional Requirements Summary

| Category | Requirement | Target |
|---|---|---|
| Performance | Collector dashboard page load | < 2 seconds on 3G |
| Availability | Uptime | 99.5% monthly |
| Offline Mode | Payment capture without connectivity | Sync within 15 min of reconnection |
| Security | Data encryption | AES-256 at rest / TLS 1.2+ in transit |
| Audit Logs | Immutable; all transactions and edits | Retained 7 years |
| Scalability | Concurrent field collections | Up to 500 concurrent users |
| SMS Delivery | Payment confirmation | Within 60 seconds of recording |
| Backup | Daily automated backup | RPO < 24 hours |


