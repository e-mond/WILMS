# Export System Report — v1.7.1

## Baseline

Frontend export suite under `apps/frontend/src/features/export` with shared branding constants, PDF/Excel/DOCX/CSV engines, and document builders.

## v1.7.1 upgrade

- PDF engine now emits a **branded cover page** before content pages (org identity, report title, metadata, confidentiality).
- Existing headers/footers/page numbers/signatures retained.
- Excel/Word continue to use WILMS brand colours and confidentiality notice.

## Presentation suitability

Exports are intended for MPs, NGOs, boards, donors, auditors, regulators, and procurement committees. Continue expanding:

- Excel: frozen headers, filters, totals, conditional formatting charts
- Word: revision history + appendix styles
- PDF: optional chart embedding for executive packs

## Regression

- `apps/frontend/src/tests/features/export/*` must remain green
- Cover page must not break registration-agreement HTML PDF path
