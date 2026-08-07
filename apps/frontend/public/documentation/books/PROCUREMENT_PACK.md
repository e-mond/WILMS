# WILMS Procurement Pack

**Version:** 1.7.3  
**Audience:** Procurement committees, RFP evaluators  
**Classification:** Confidential

---

## 1. Vendor information

| Field | Value |
|-------|-------|
| Product name | WILMS — Women's Interest-Free Loan Management System |
| Product type | SaaS operational platform |
| Deployment model | Cloud (Vercel + Neon PostgreSQL) |
| Current version | v1.7.3 (documentation); platform v1.7.2 |
| License | Proprietary |

---

## 2. Functional requirements compliance

| Requirement area | Status | Evidence |
|-----------------|--------|----------|
| Borrower registration | Complete | Officer manual, BRD BR-001–008 |
| Loan lifecycle | Complete | Product book § workflows |
| Field collections | Complete | Collector manual, offline support |
| Reconciliation | Complete | Operations manual |
| Capital pool management | Complete | Financial engine documentation |
| RBAC (5 roles) | Complete | Security book, shared-rbac |
| Audit trail | Complete | Append-only audit log |
| Reporting | Complete | Reporting book |
| Executive dashboard | Complete | Executive intelligence |
| Notifications | Complete | Notification book |
| Export capabilities | Complete | Contextual exports v1.7.3 |

---

## 3. Technical requirements compliance

| Requirement | Status | Detail |
|-------------|--------|--------|
| Web-based access | Complete | Next.js 14, responsive |
| Mobile field access | Complete | PWA, collector field shell |
| HTTPS encryption | Complete | Vercel enforced |
| Session security | Complete | HMAC-signed cookies |
| Database | Complete | Neon PostgreSQL |
| Backup/recovery | Complete | Neon PITR |
| API access | Complete | REST JSON via Route Handlers |
| Offline capability | Complete | Collector payment queue |

---

## 4. Security compliance

| Control | Status |
|---------|--------|
| Authentication | HMAC sessions, bcrypt passwords |
| Authorization | RBAC + permission overrides |
| Audit logging | Append-only |
| Rate limiting | 300 req/min global |
| CSRF protection | Mutating BFF paths |
| Upload restrictions | File type allowlist |
| Export confidentiality | Footer on all exports |

---

## 5. Documentation deliverables (v1.7.3)

| Document | Format |
|----------|--------|
| Product Book | MD, PDF, DOCX |
| Business Requirements Book | MD, PDF, DOCX |
| Technical Architecture Guide | MD, PDF, DOCX |
| API Reference | MD, PDF, DOCX |
| Security & Compliance Book | MD, PDF, DOCX |
| Operations Manual | MD, PDF, DOCX |
| Role manuals (5) | MD, PDF, DOCX |
| Developer Guide | MD, PDF, DOCX |
| Product Dossier | MD, PDF, DOCX |
| Board Presentation | MD, PDF, DOCX |

Generate: `npm run docs:generate`

---

## 6. Testing and quality

| Test type | Tool | Status |
|-----------|------|--------|
| Unit tests | Vitest | Active |
| E2E tests | Playwright | Active |
| RBAC smoke | Custom script | Active |
| API integrity | Custom script | Active |
| Migration verify | Custom script | Active |
| Version consistency | Custom script | Active |

---

## 7. Deployment and support

| Item | Detail |
|------|--------|
| Hosting | Vercel (application), Neon (database) |
| Runtime | Node.js 22.x |
| Migration strategy | Forward-only SQL journal |
| Monitoring | Health endpoint, ops incidents |
| Cron | Vercel Cron daily notification dispatch |

---

## 8. Pricing model

Contact programme administration for licensing terms. Deployment on partner's Vercel/Neon accounts or managed hosting.

---

## 9. Evaluation checklist

- [ ] Review Product Dossier
- [ ] Verify RBAC against organisation role structure
- [ ] Test demo environment with provided credentials
- [ ] Review Security & Compliance Book
- [ ] Validate export samples (PDF compliance pack)
- [ ] Confirm roadmap alignment with programme needs
- [ ] Review Business Requirements Book status columns

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
