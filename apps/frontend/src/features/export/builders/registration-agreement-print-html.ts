import { WILMS_BRAND_LOGO_PATH } from '@/features/export/constants/branding';
import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFieldTable(rows: { label: string; value: string }[]): string {
  const pairs: Array<{ label: string; value: string }[]> = [];

  for (let index = 0; index < rows.length; index += 2) {
    pairs.push(rows.slice(index, index + 2));
  }

  const body = pairs
    .map((pair) => {
      const cells = pair
        .map(
          (row) =>
            `<td class="field-cell"><span class="field-label">${escapeHtml(row.label)}</span><span class="field-value">${escapeHtml(row.value)}</span></td>`,
        )
        .join('');

      const filler = pair.length === 1 ? '<td class="field-cell field-cell-empty"></td>' : '';

      return `<tr class="field-row">${cells}${filler}</tr>`;
    })
    .join('');

  return `<table class="field-table" role="presentation"><tbody>${body}</tbody></table>`;
}

function renderApplicantPhoto(src: string | null): string {
  if (src) {
    return `<img src="${src}" alt="Applicant passport photograph" class="photo-passport" />`;
  }

  return `<div class="photo-placeholder">Photograph not available</div>`;
}

function renderGuarantorPhoto(src: string | null): string {
  if (src) {
    return `<img src="${src}" alt="Guarantor photograph" class="photo-guarantor" />`;
  }

  return `<div class="photo-placeholder photo-placeholder-sm">Photograph not available</div>`;
}

function renderSignatureLine(
  label: string,
  imageDataUrl: string | null | undefined,
  thumbprintDataUrl?: string | null,
): string {
  const hasSignature = Boolean(imageDataUrl);
  const hasThumbprint = Boolean(thumbprintDataUrl);

  if (hasSignature || hasThumbprint) {
    return `
      <div class="sig-media keep-together">
        <p class="sig-caption">${escapeHtml(label)}</p>
        <table class="sig-media-table" role="presentation"><tr>
          ${
            hasSignature
              ? `<td><img src="${imageDataUrl}" alt="${escapeHtml(label)}" class="signature-image" /></td>`
              : ''
          }
          ${
            hasThumbprint
              ? `<td><img src="${thumbprintDataUrl}" alt="Thumbprint" class="signature-image" /></td>`
              : ''
          }
        </tr></table>
      </div>
    `;
  }

  return `
    <div class="sig-line-row keep-together">
      <span class="sig-label">${escapeHtml(label)}</span>
      <span class="sig-blank" aria-hidden="true"></span>
    </div>
  `;
}

function renderDateLine(dateLabel: string, hasElectronicSignature: boolean): string {
  return `
    <div class="sig-line-row keep-together">
      <span class="sig-label">Date:</span>
      <span class="sig-blank${hasElectronicSignature ? ' sig-blank-filled' : ''}">${
        hasElectronicSignature ? escapeHtml(dateLabel) : ''
      }</span>
    </div>
  `;
}

/**
 * Isolated print/PDF styles. Must never inherit the app dark theme.
 */
export const REGISTRATION_PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 12mm 12mm 16mm 12mm;

    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-family: "DM Sans", "Segoe UI", Arial, sans-serif;
      font-size: 8pt;
      color: #5c5c5c;
    }
  }

  :root {
    color-scheme: light only;
    --doc-bg: #ffffff;
    --doc-text: #1a1a1a;
    --doc-muted: #5c5c5c;
    --doc-border: #d3d1c7;
    --doc-rule: #e8e6df;
    --doc-brand: #0f6e56;
    --doc-brand-soft: #f4f8f6;
    --doc-brand-border: #c9e0d7;
  }

  html {
    color-scheme: light only !important;
    background: #ffffff !important;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    color: #1a1a1a !important;
    font-family: "DM Sans", "Segoe UI", Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.45;
    background: #ffffff !important;
  }

  .document {
    width: 100%;
    max-width: 186mm;
    margin: 0 auto;
    background: #ffffff !important;
    color: #1a1a1a !important;
  }

  .brand-bar {
    height: 4px;
    background: #0f6e56;
    margin: 0 0 10px;
  }

  .header {
    text-align: center;
    padding: 0 0 10px;
    border-bottom: 1px solid var(--doc-border);
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .logo-wrap {
    display: flex;
    justify-content: center;
    margin: 0 0 8px;
  }

  .logo-img {
    width: 18mm;
    height: 18mm;
    object-fit: contain;
    border-radius: 3mm;
    background: #ffffff !important;
    border: 1px solid var(--doc-brand-border);
  }

  .program-name {
    margin: 0;
    font-size: 10.5pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #1a1a1a !important;
  }

  .doc-title {
    margin: 6px 0 0;
    font-size: 12pt;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #0f6e56 !important;
  }

  .header-meta {
    margin: 8px auto 0;
    max-width: 170mm;
    font-size: 8.5pt;
    color: #5c5c5c !important;
  }

  .header-meta strong {
    color: #1a1a1a !important;
  }

  .intro {
    margin: 10px 0 0;
    text-align: left;
  }

  .intro p {
    margin: 0 0 6px;
    font-size: 8.75pt;
    line-height: 1.45;
    color: #1a1a1a !important;
  }

  .intro p:last-child {
    margin-bottom: 0;
    color: #3d3d3d !important;
  }

  .section {
    margin-top: 12px;
  }

  .section-title {
    margin: 0 0 8px;
    padding: 0 0 4px;
    border-bottom: 1.5px solid #0f6e56;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #0f6e56 !important;
    break-after: avoid;
    page-break-after: avoid;
  }

  .field-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .field-row {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .field-cell {
    width: 50%;
    vertical-align: top;
    padding: 4px 8px 7px 0;
    border-bottom: 1px solid var(--doc-rule);
    background: transparent !important;
  }

  .field-cell-empty {
    border-bottom: none;
  }

  .field-label {
    display: block;
    margin-bottom: 2px;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #5c5c5c !important;
  }

  .field-value {
    display: block;
    font-size: 9.5pt;
    line-height: 1.4;
    color: #1a1a1a !important;
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .photo-section {
    text-align: center;
    margin-top: 10px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .photo-passport {
    display: block;
    width: 28mm;
    height: 36mm;
    margin: 0 auto;
    object-fit: contain;
    object-position: center top;
    background: #ffffff !important;
    border: 1.5px solid #0f6e56;
  }

  .photo-guarantor {
    display: block;
    width: 22mm;
    height: 28mm;
    object-fit: contain;
    object-position: center top;
    background: #ffffff !important;
    border: 1px solid #0f6e56;
  }

  .photo-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28mm;
    height: 36mm;
    margin: 0 auto;
    border: 1.5px dashed #0f6e56;
    font-size: 7.5pt;
    text-align: center;
    padding: 4px;
    color: #5c5c5c !important;
    background: #ffffff !important;
  }

  .photo-placeholder-sm {
    width: 22mm;
    height: 28mm;
    margin: 0;
  }

  .guarantor-layout {
    width: 100%;
    border-collapse: collapse;
  }

  .guarantor-layout td {
    vertical-align: top;
    background: transparent !important;
  }

  .guarantor-photo-cell {
    width: 26mm;
    padding-right: 10px;
  }

  .declaration {
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--doc-brand-border);
    background: #f4f8f6 !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .declaration .section-title {
    border-bottom-color: #0f6e56;
  }

  .declaration-text {
    margin: 0;
    font-size: 9pt;
    line-height: 1.5;
    white-space: pre-wrap;
    color: #1a1a1a !important;
    overflow-wrap: anywhere;
  }

  .keep-together {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .sig-block {
    margin-top: 10px;
  }

  .sig-line-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-top: 10px;
  }

  .sig-label {
    flex: 0 0 auto;
    font-size: 9pt;
    font-weight: 700;
    color: #1a1a1a !important;
    white-space: nowrap;
  }

  .sig-blank {
    flex: 1 1 auto;
    min-height: 14mm;
    border-bottom: 1.5px solid #1a1a1a;
  }

  .sig-blank-filled {
    display: flex;
    align-items: flex-end;
    padding-bottom: 2px;
    font-size: 9pt;
    color: #1a1a1a !important;
  }

  .sig-caption {
    margin: 0 0 4px;
    font-size: 8pt;
    font-weight: 700;
    color: #5c5c5c !important;
  }

  .sig-media-table {
    width: 100%;
    border-collapse: collapse;
  }

  .sig-media-table td {
    width: 50%;
    padding-right: 8px;
    background: transparent !important;
  }

  .signature-image {
    display: block;
    width: 100%;
    max-width: 70mm;
    height: 16mm;
    object-fit: contain;
    object-position: left bottom;
    border: 1px solid var(--doc-border);
    background: #ffffff !important;
  }

  .officer-grid {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }

  .officer-grid td {
    width: 50%;
    padding: 8px 10px 8px 0;
    vertical-align: top;
    background: transparent !important;
  }

  .legal-text, .terms-text {
    margin: 0;
    font-size: 9pt;
    line-height: 1.55;
    white-space: pre-wrap;
    color: #1a1a1a !important;
    overflow-wrap: anywhere;
  }

  .footer {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1.5px solid #0f6e56;
    text-align: center;
    font-size: 7.5pt;
    color: #5c5c5c !important;
  }

  @media print {
    html, body, .document {
      background: #ffffff !important;
      color: #1a1a1a !important;
    }
  }
`;

export function buildRegistrationAgreementPrintHtml(content: RegistrationAgreementContent): string {
  const { legal } = content;
  const title = content.documentTitle || legal.formTitle;
  const reference = content.registrationReference ?? 'Pending assignment';
  const logoSrc = content.logoDataUrl || WILMS_BRAND_LOGO_PATH;
  const hasGuarantorElectronic = Boolean(content.guarantorSignature || content.guarantorThumbprint);
  const hasBorrowerElectronic = Boolean(content.borrowerSignature || content.borrowerThumbprint);

  const body = `
    <div class="document">
      <div class="brand-bar" aria-hidden="true"></div>

      <header class="header">
        <div class="logo-wrap">
          <img src="${logoSrc}" alt="WILMS" class="logo-img" width="68" height="68" />
        </div>
        <p class="program-name">${escapeHtml(legal.programName.toUpperCase())}</p>
        <h1 class="doc-title">${escapeHtml(title)}</h1>
        <p class="header-meta">
          Reference: <strong>${escapeHtml(reference)}</strong>
          · Generated: <strong>${escapeHtml(content.generatedAt)}</strong>
          · Status: <strong>${escapeHtml(content.applicationStatus ?? 'Pending review')}</strong>
        </p>
        <div class="intro">
          <p>${escapeHtml(legal.instructionText)}</p>
          <p>${escapeHtml(legal.programDeclaration)}</p>
        </div>
      </header>

      <section class="photo-section">
        <h2 class="section-title">Applicant Passport Photograph</h2>
        ${renderApplicantPhoto(content.borrowerPhotoUrl)}
      </section>

      <section class="section">
        <h2 class="section-title">Applicant Information</h2>
        ${renderFieldTable(content.applicantRows)}
      </section>

      <section class="section">
        <h2 class="section-title">Work / Business Information</h2>
        ${renderFieldTable(content.workRows)}
      </section>

      <section class="section">
        <h2 class="section-title">Guarantor Information</h2>
        <table class="guarantor-layout keep-together" role="presentation">
          <tr>
            <td class="guarantor-photo-cell">${renderGuarantorPhoto(content.guarantorPhotoUrl)}</td>
            <td>${renderFieldTable(content.guarantorRows)}</td>
          </tr>
        </table>
      </section>

      <section class="declaration">
        <h2 class="section-title">Guarantor Declaration</h2>
        <p class="declaration-text">${escapeHtml(legal.guarantorDeclaration)}</p>
        <div class="sig-block">
          ${renderSignatureLine(
            'Guarantor Signature / Thumbprint:',
            content.guarantorSignature,
            content.guarantorThumbprint,
          )}
          ${renderDateLine(content.signedDate, hasGuarantorElectronic)}
        </div>
      </section>

      <section class="declaration">
        <h2 class="section-title">Borrower Declaration</h2>
        <p class="declaration-text">${escapeHtml(legal.borrowerDeclaration)}</p>
        <div class="sig-block">
          ${renderSignatureLine(
            'Applicant Signature / Thumbprint:',
            content.borrowerSignature,
            content.borrowerThumbprint,
          )}
          ${renderDateLine(content.signedDate, hasBorrowerElectronic)}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">Key Terms &amp; Enforcement</h2>
        <p class="terms-text">${escapeHtml(legal.keyTerms)}</p>
      </section>

      <section class="section">
        <h2 class="section-title">Legal Notice</h2>
        <p class="legal-text">${escapeHtml(legal.legalNotice)}</p>
      </section>

      <section class="section keep-together">
        <h2 class="section-title">Officer Verification</h2>
        <table class="officer-grid" role="presentation">
          <tr>
            <td>
              <div class="sig-line-row">
                <span class="sig-label">Officer Name:</span>
                <span class="sig-blank sig-blank-filled">${escapeHtml(content.officerName || 'Not provided')}</span>
              </div>
            </td>
            <td>
              <div class="sig-line-row">
                <span class="sig-label">Officer ID:</span>
                <span class="sig-blank sig-blank-filled">${escapeHtml(content.officerId ?? 'Not provided')}</span>
              </div>
            </td>
          </tr>
        </table>
        <div class="sig-block">
          ${renderSignatureLine('Officer Signature:', content.officerSignature)}
          ${renderDateLine(content.signedDate, Boolean(content.officerSignature))}
        </div>
      </section>

      <footer class="footer">
        WILMS · Women's Interest-Free Loan Management System · ${escapeHtml(title)} · Official programme record
      </footer>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en" style="color-scheme:light;background:#ffffff">
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(title)} · WILMS</title>
  <style>${REGISTRATION_PRINT_STYLES}</style>
</head>
<body style="background:#ffffff;color:#1a1a1a;color-scheme:light">${body}</body>
</html>`;
}
