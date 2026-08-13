# Export Branding Guide

**Version:** v1.8.0  
**Classification:** Confidential

---

## File names

Prefix `WILMS_`. Use underscores between words. Preserve hyphens inside official IDs and ISO dates (`BRW-2026-00417`, `2026-08-15`). Do not use raw UUIDs.

| Document | Example |
|----------|---------|
| Borrower profile | `WILMS_Borrower_Profile_Gloria_Serwaa_BRW-2026-00417.pdf` |
| Loan schedule | `WILMS_Loan_Schedule_LN-2026-00124.pdf` |
| Group profile | `WILMS_Group_Profile_Airport_Ridge_Group_001.pdf` |
| Statement | `WILMS_Statement_BRW-2026-00417_2026-08-15.pdf` |

Helpers: `buildBrandedExportFilename` and `buildExportFilename` in `apps/frontend/src/features/export/utils/formatters.ts`.

Applies to PDF, Word, Excel, CSV, print, and email attachments that use the export framework.

## Printed documents

All branded documents must include:

- Readable entity IDs
- Collector shown as name and code where relevant
- British date formatting
- Page numbers in the footer
- Organisation header and confidentiality footer

Print CSS already emits `Page` counters. Borrower profile exports now use `BRW-` IDs and the location cascade.
