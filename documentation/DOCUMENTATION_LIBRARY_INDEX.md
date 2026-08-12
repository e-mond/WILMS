# WILMS Documentation Library — Master Index

**Version:** 1.7.4  
**Release type:** Documentation Centre (in-app) + official library  
**Last updated:** August 2026  
**Classification:** Confidential — authorised personnel only

---

## Purpose

This index is the authoritative catalogue of WILMS documentation. Platform features are documented through **v1.7.2**. Release **v1.7.3** delivered the source library and branded PDF/DOCX artefacts. Release **v1.7.4** delivers the in-application **Documentation Centre** at `/documentation` for browse, search, print, and download.

British English is preferred in portal UI copy and ongoing documentation maintenance (organisation, authorisation, behaviour, centre, programme).

---

## In-app Documentation Centre

| Surface | Path |
|---------|------|
| Documentation Centre | `/documentation` |
| Settings entry | Settings → Documentation |
| Markdown assets | `/documentation/**/*.md` (synced to `public/`) |
| PDF downloads | `/documentation/pdf/*.pdf` |
| Word downloads | `/documentation/docx/*.docx` |

Regenerate and sync:

```bash
npm run docs:prepare
```

---

## Primary books

| Book | Path | Formats |
|------|------|---------|
| WILMS Product Book | `books/WILMS_PRODUCT_BOOK.md` | MD, PDF, DOCX |
| Financial Engine Book | `books/FINANCIAL_ENGINE_BOOK.md` | MD, PDF, DOCX |
| Business Requirements Book | `books/BUSINESS_REQUIREMENTS_BOOK.md` | MD, PDF, DOCX |
| Security & Compliance Book | `books/SECURITY_COMPLIANCE_BOOK.md` | MD, PDF, DOCX |
| Reporting & Analytics Book | `books/REPORTING_ANALYTICS_BOOK.md` | MD, PDF, DOCX |
| Notification & Communication Book | `books/NOTIFICATION_COMMUNICATION_BOOK.md` | MD, PDF, DOCX |
| Product Dossier | `books/PRODUCT_DOSSIER.md` | MD, PDF, DOCX |
| Board Presentation | `books/BOARD_PRESENTATION.md` | MD, PDF, DOCX |
| Procurement Pack | `books/PROCUREMENT_PACK.md` | MD, PDF, DOCX |
| Implementation Guide | `books/IMPLEMENTATION_GUIDE.md` | MD, PDF, DOCX |

See also: `technical/`, `operations/`, `user-guides/`, `developer/`, `roadmap/`, `location/`.

---

## Ghana location master (v1.8.0)

| Document | Path |
|----------|------|
| Architecture review | `location/LOCATION_ARCHITECTURE_REVIEW.md` |
| Master architecture | `location/LOCATION_MASTER_ARCHITECTURE.md` |
| Ghana hierarchy | `location/GHANA_ADMINISTRATIVE_HIERARCHY.md` |
| Sync guide | `location/LOCATION_SYNC_GUIDE.md` |
| Community suggestions | `location/COMMUNITY_SUGGESTION_WORKFLOW.md` |
| Offline strategy | `location/OFFLINE_LOCATION_STRATEGY.md` |
| API reference | `location/API_LOCATION_REFERENCE.md` |
| Migration strategy | `location/MIGRATION_STRATEGY.md` |
| Executive geo analytics | `location/EXECUTIVE_GEO_ANALYTICS.md` |
| Test evidence | `location/TEST_EVIDENCE.md` |
| Final report | `location/FINAL_LOCATION_MASTER_REPORT.md` |

---

## Related reports

- `docs/v1.7.4/DOCUMENTATION_CENTRE_REPORT.md`
- `documentation/FINAL_DOCUMENTATION_REPORT.md`
