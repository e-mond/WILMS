# Export architecture

- `export_jobs` tracks request metadata, status, row counts, expiry
- Preview rows generated server-side for selected entities
- Branded PDF/Excel/CSV downloads continue via frontend export engines
- Object-storage backed artifacts are a future enhancement

## Registration agreement (Loan Application & Agreement Form)

Authoritative layout for registration **Print** and **Export PDF** is the shared HTML
renderer:

- `apps/frontend/src/features/export/builders/registration-agreement-print-html.ts`
- Content model: `apps/frontend/src/utils/registration-agreement-fields.ts`
- Asset prep (logo + photos as data URLs): `prepareRegistrationAgreementForExport()`

### A4 specification

- Portrait A4 (`@page size: A4 portrait`)
- White page background; dark/readable text (independent of app theme)
- WILMS brand logo: `/icons/icon-192.png` (embedded as data URL for export)
- Margins approximately 12mm / 12mm / 16mm / 12mm
- Brand teal accents for section headings only

### Document sections

1. Logo + programme title + form title + intro
2. Applicant passport photograph (centered)
3. Applicant Information (Ghana location hierarchy)
4. Work / Business Information
5. Guarantor Information
6. Guarantor Declaration + signature lines
7. Borrower Declaration + signature lines
8. Key Terms & Enforcement (from registration legal config)
9. Legal Notice (from registration legal config)
10. Officer Verification

Readable borrower references (for example `BRW-2026-00417`) are used; raw UUIDs are never shown.

### Filename convention

`WILMS_Borrower_Registration_{FullName}_{BRW-YYYY-NNNNN}.pdf`

### Visual QA

From `apps/frontend`:

```bash
npx vite-node --config vitest.config.ts scripts/render-registration-pdf-samples.ts
```

Samples write to `tmp-export-qa/` (gitignored). Inspect short and long HTML/PDF/PNG before release.

### Known limitation

Browser **Export PDF** still uses jsPDF + html2canvas with A4 canvas slicing. Native
**Print / Save as PDF** remains the highest-fidelity path and uses the same HTML template.
