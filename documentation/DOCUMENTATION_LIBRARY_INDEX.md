# WILMS Documentation Library — Master Index

**Version:** 1.8.1  
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

See also: `technical/`, `operations/`, `user-guides/`, `developer/`, `roadmap/`, `location/`, `notifications/`.

---

## Ghana location master (v1.8.0)

| Document | Path |
|----------|------|
| Architecture review (v1) | `location/LOCATION_ARCHITECTURE_REVIEW.md` |
| Hierarchy architecture review (v2) | `location/GHANA_HIERARCHY_ARCHITECTURE_REVIEW.md` |
| Administrative research | `location/GHANA_ADMINISTRATIVE_RESEARCH.md` |
| Administrative model | `location/GHANA_ADMINISTRATIVE_MODEL.md` |
| Sub-district architecture | `location/SUB_DISTRICT_ARCHITECTURE.md` |
| Electoral area model | `location/ELECTORAL_AREA_MODEL.md` |
| Community guide | `location/COMMUNITY_AND_SUBURB_GUIDE.md` |
| Community location guide (v1.8.0 completion) | `location/COMMUNITY_LOCATION_GUIDE.md` |
| Community coverage audit | `location/COMMUNITY_COVERAGE_AUDIT.md` |
| Community import report | `location/COMMUNITY_IMPORT_REPORT.md` |
| Community import process | `location/COMMUNITY_IMPORT_PROCESS.md` |
| Community search architecture | `location/COMMUNITY_SEARCH_ARCHITECTURE.md` |
| Community data quality | `location/COMMUNITY_DATA_QUALITY.md` |
| Community data quality report | `location/COMMUNITY_DATA_QUALITY_REPORT.md` |
| Community test report | `location/COMMUNITY_TEST_REPORT.md` |
| Final community completion report | `location/FINAL_COMMUNITY_COMPLETION_REPORT.md` |
| Import pipeline | `location/LOCATION_IMPORT_PIPELINE.md` |
| API reference | `location/LOCATION_API_REFERENCE.md` |
| Offline strategy | `location/OFFLINE_LOCATION_STRATEGY.md` |
| GIS preparation | `location/GIS_PREPARATION.md` |
| Territory management | `location/TERRITORY_MANAGEMENT.md` |
| Migration strategy | `location/MIGRATION_STRATEGY.md` |
| Import report | `location/GHANA_IMPORT_REPORT.md` |
| Test report | `location/GHANA_HIERARCHY_TEST_REPORT.md` |
| Final report | `location/FINAL_GHANA_HIERARCHY_REPORT.md` |

---

## Borrower communication (v1.8.0)

| Document | Path |
|----------|------|
| Audit | `notifications/BORROWER_COMMUNICATION_AUDIT.md` |
| Workflow | `notifications/BORROWER_COMMUNICATION_WORKFLOW.md` |
| SMS library | `notifications/SMS_TEMPLATE_LIBRARY.md` |
| Email library | `notifications/EMAIL_TEMPLATE_LIBRARY.md` |
| Trigger matrix | `notifications/NOTIFICATION_TRIGGER_MATRIX.md` |
| Scheduler timing | `notifications/SCHEDULER_NOTIFICATION_TIMING.md` |
| Test report | `notifications/BORROWER_COMMUNICATION_TEST_REPORT.md` |
| Final correction report | `notifications/FINAL_COMMUNICATION_CORRECTION_REPORT.md` |

---

## Related reports

- `docs/v1.7.4/DOCUMENTATION_CENTRE_REPORT.md`
- `documentation/FINAL_DOCUMENTATION_REPORT.md`
- `documentation/release/WILMS_v1.8.1_PRODUCTION_MAINTENANCE_REPORT.md`
- `documentation/release/WILMS_v1.8.0_FINAL_PRODUCTION_RELEASE_REPORT.md`
- `documentation/release/MIGRATION_0044_VERIFICATION.md`
- `docs/v1.8.0/market-readiness/FINAL_V180_MARKET_READINESS_REPORT.md`
