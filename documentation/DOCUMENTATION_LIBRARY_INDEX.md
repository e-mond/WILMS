# WILMS Documentation Library — Master Index

**Version:** 1.7.3  
**Release type:** Official documentation suite  
**Last updated:** August 2026  
**Classification:** Confidential — authorized personnel only

---

## Purpose

This index is the authoritative catalogue of WILMS (Women's Interest-Free Loan Management System) documentation through release **v1.7.3**. Platform feature development completed at **v1.7.2** (release candidate stabilization). Release **v1.7.3** delivers the official documentation library, branded PDF/DOCX artefacts, removal of the standalone Export Center in favour of contextual exports embedded in reports and intelligence surfaces, the **Financial Engine Book**, and an **in-app documentation portal** at `/documentation` (Super Admin).

---

## Primary books

| Book | Path | Formats | Audience |
|------|------|---------|----------|
| **WILMS Product Book** | `books/WILMS_PRODUCT_BOOK.md` | MD, PDF, DOCX | All stakeholders — master reference |
| **Financial Engine Book** | `books/FINANCIAL_ENGINE_BOOK.md` | MD, PDF, DOCX | Finance, auditors, technical leads |
| **Business Requirements Book** | `books/BUSINESS_REQUIREMENTS_BOOK.md` | MD, PDF, DOCX | Product owners, procurement, auditors |
| **Security & Compliance Book** | `books/SECURITY_COMPLIANCE_BOOK.md` | MD, PDF, DOCX | Security reviewers, compliance officers |
| **Reporting & Analytics Book** | `books/REPORTING_ANALYTICS_BOOK.md` | MD, PDF, DOCX | Finance, programme managers, board |
| **Notification & Communication Book** | `books/NOTIFICATION_COMMUNICATION_BOOK.md` | MD, PDF, DOCX | Operations, communications leads |
| **Product Dossier** | `books/PRODUCT_DOSSIER.md` | MD, PDF, DOCX | Investors, partners, executive briefings |
| **Board Presentation** | `books/BOARD_PRESENTATION.md` | MD, PDF, DOCX | Directors, MPs, NGO boards |
| **Procurement Pack** | `books/PROCUREMENT_PACK.md` | MD, PDF, DOCX | Procurement committees, RFP evaluators |
| **Implementation Guide** | `books/IMPLEMENTATION_GUIDE.md` | MD, PDF, DOCX | Deployment and rollout teams |

---

## Technical documentation

| Document | Path | Formats |
|----------|------|---------|
| Technical Architecture Guide | `technical/TECHNICAL_ARCHITECTURE_GUIDE.md` | MD, PDF, DOCX |
| API Reference | `technical/API_REFERENCE.md` | MD, PDF, DOCX |
| Developer Guide | `developer/DEVELOPER_GUIDE.md` | MD, PDF, DOCX |

---

## Operations

| Document | Path | Formats |
|----------|------|---------|
| Operations Manual | `operations/OPERATIONS_MANUAL.md` | MD, PDF, DOCX |

---

## Role-based user guides

| Role | Path | PDF output name |
|------|------|-----------------|
| Super Admin | `user-guides/SUPER_ADMIN_MANUAL.md` | `ADMINISTRATOR_MANUAL` |
| Registration Officer | `user-guides/OFFICER_MANUAL.md` | `OFFICER_MANUAL` |
| Collector | `user-guides/COLLECTOR_MANUAL.md` | `COLLECTOR_MANUAL` |
| Approver | `user-guides/APPROVER_MANUAL.md` | `APPROVER_MANUAL` |
| Auditor | `user-guides/AUDITOR_MANUAL.md` | `AUDITOR_MANUAL` |

---

## Roadmap & planning

| Document | Path |
|----------|------|
| Future Work Book | `roadmap/ROADMAP_FUTURE_WORK_BOOK.md` |

---

## Branding & web portal

| Document | Path |
|----------|------|
| Brand System | `branding/BRAND_SYSTEM.md` |
| Web docs portal structure | `web/README.md` |
| Navigation tree | `web/nav.json` |
| **In-app documentation portal** | `apps/frontend/src/app/(super-admin)/documentation/page.tsx` |

---

## Generated artefacts

Run from repository root:

```bash
npm run docs:generate
```

Outputs land in:

- `documentation/pdf/` — branded PDF exports (includes `FINANCIAL_ENGINE_BOOK.pdf`)
- `documentation/docx/` — Microsoft Word exports (includes `FINANCIAL_ENGINE_BOOK.docx`)

---

## Related repository documentation

| Location | Purpose |
|----------|---------|
| `docs/` | Architecture hub, ADRs, environment, financial model |
| `docs/v1.7.2/` | RC1 release evidence pack (last feature platform release) |
| `docs/v1.7.3/` | Documentation suite release pack |
| `VERSION.md` | Current version identity |
| `CHANGELOG.md` | Version history |

---

## Version lineage

| Version | Focus |
|---------|-------|
| v1.7.0 | Enterprise finance, reporting, executive intelligence |
| v1.7.1 | Market readiness, executive/operational dashboard separation |
| v1.7.2 | RC stabilization — Export Center actions, Product Tour 2.0 |
| **v1.7.3** | **Official documentation library; Export Center removed; contextual exports; Financial Engine book; in-app portal** |
| v1.8+ | Integrations, payments, automation (planned) |

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
