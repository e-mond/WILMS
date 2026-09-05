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

function renderPhoto(src: string | null, alt: string, passport = false): string {
  if (src) {
    return `<img src="${src}" alt="${escapeHtml(alt)}" class="${passport ? 'photo-passport' : 'photo-guarantor'}" />`;
  }

  return `<div class="photo-placeholder">${escapeHtml(alt)}</div>`;
}

function renderSignatureBlock(
  label: string,
  imageDataUrl: string | null | undefined,
  options: {
    showThumbprint?: boolean;
    thumbprintDataUrl?: string | null;
    dateLabel: string;
  },
): string {
  const signature = imageDataUrl
    ? `<img src="${imageDataUrl}" alt="${escapeHtml(label)} signature" class="signature-image" />`
    : `<div class="signature-line">Sign here</div>`;

  const thumbprint =
    options.showThumbprint && options.thumbprintDataUrl
      ? `<img src="${options.thumbprintDataUrl}" alt="${escapeHtml(label)} thumbprint" class="signature-image" />`
      : options.showThumbprint
        ? `<div class="thumbprint-note">Thumbprint to be applied on printed copy</div>`
        : '';

  return `
    <div class="signature-block keep-together">
      <p class="signature-label">${escapeHtml(label)}</p>
      <table class="signature-table" role="presentation">
        <tr>
          <td><p class="signature-caption">Signature</p>${signature}</td>
          ${options.showThumbprint ? `<td><p class="signature-caption">Thumbprint</p>${thumbprint}</td>` : ''}
        </tr>
      </table>
      <p class="signature-caption">Date</p>
      <div class="date-line">${escapeHtml(options.dateLabel)}</div>
    </div>
  `;
}

/**
 * Isolated print/PDF styles. Must never inherit the app dark theme.
 * Explicit light color-scheme + white backgrounds for html2canvas + browser print.
 */
export const REGISTRATION_PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 14mm 14mm 18mm 14mm;

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
    --doc-rule: #eceae3;
    --doc-brand: #0f6e56;
    --doc-brand-soft: #f7faf8;
    --doc-brand-border: #c9e0d7;
  }

  html {
    color-scheme: light only;
    background: var(--doc-bg) !important;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    color: var(--doc-text) !important;
    font-family: "DM Sans", "Segoe UI", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    background: var(--doc-bg) !important;
  }

  .document {
    background: var(--doc-bg) !important;
    color: var(--doc-text) !important;
    max-width: 186mm;
    margin: 0 auto;
  }

  .brand-bar {
    height: 5px;
    background: linear-gradient(90deg, #0f6e56 0%, #1a9a78 55%, #0f6e56 100%);
    margin: 0 0 12px;
  }

  .header {
    border: 1px solid var(--doc-border);
    border-top: 3px solid var(--doc-brand);
    background: var(--doc-brand-soft) !important;
    padding: 14px 16px 16px;
    text-align: center;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .header .logo {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 24pt;
    letter-spacing: 0.22em;
    color: var(--doc-brand) !important;
    margin: 0;
    font-weight: 700;
  }

  .header .system {
    margin: 4px 0 0;
    font-size: 8.5pt;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--doc-muted) !important;
  }

  .header .program {
    margin: 10px 0 0;
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--doc-text) !important;
  }

  .header h1 {
    margin: 8px 0 0;
    font-size: 13pt;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--doc-brand) !important;
  }

  .header-meta {
    margin: 12px auto 0;
    max-width: 95%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
    text-align: left;
    font-size: 9pt;
  }

  .header-meta span {
    display: block;
    color: var(--doc-muted) !important;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 700;
  }

  .header-meta strong {
    display: block;
    margin-top: 2px;
    color: var(--doc-text) !important;
    font-weight: 600;
    word-break: break-word;
  }

  .header .instruction {
    margin: 12px auto 0;
    max-width: 95%;
    font-size: 9.5pt;
    line-height: 1.5;
    color: var(--doc-text) !important;
  }

  .section {
    margin-top: 14px;
  }

  .section-title {
    border-bottom: 2px solid var(--doc-brand);
    padding-bottom: 5px;
    margin: 0 0 10px;
    text-align: left;
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--doc-brand) !important;
    letter-spacing: 0.03em;
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
    padding: 6px 10px 10px 0;
    border-bottom: 1px solid var(--doc-rule);
    background: transparent !important;
  }

  .field-cell-empty { border-bottom: none; }

  .field-label {
    display: block;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--doc-muted) !important;
    margin-bottom: 3px;
  }

  .field-value {
    display: block;
    font-size: 10pt;
    color: var(--doc-text) !important;
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    line-height: 1.45;
  }

  .photo-row {
    text-align: center;
    margin: 10px 0 8px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .photo-passport {
    width: 30mm;
    height: 38mm;
    object-fit: cover;
    border: 2px solid var(--doc-brand);
    background: #fff !important;
  }

  .photo-guarantor {
    width: 24mm;
    height: 30mm;
    object-fit: cover;
    border: 1px solid var(--doc-brand);
    background: #fff !important;
  }

  .photo-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30mm;
    height: 38mm;
    border: 2px dashed var(--doc-brand);
    font-size: 8pt;
    color: var(--doc-muted) !important;
    background: #fff !important;
  }

  .guarantor-layout { width: 100%; border-collapse: collapse; }
  .guarantor-layout td { vertical-align: top; background: transparent !important; }
  .guarantor-photo-cell { width: 30mm; padding-right: 12px; }

  .declaration-box {
    border: 1px solid var(--doc-brand-border);
    background: var(--doc-brand-soft) !important;
    padding: 12px 14px;
    margin-top: 14px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .declaration-box h3 {
    margin: 0 0 8px;
    text-align: left;
    font-size: 10.5pt;
    text-transform: uppercase;
    color: var(--doc-brand) !important;
    letter-spacing: 0.03em;
  }

  .declaration-box p {
    margin: 0;
    font-size: 9.5pt;
    line-height: 1.55;
    white-space: pre-wrap;
    color: var(--doc-text) !important;
  }

  .keep-together {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .signature-block { margin-top: 12px; }
  .signature-label {
    text-align: left;
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--doc-muted) !important;
    margin: 0 0 8px;
  }
  .signature-table { width: 100%; border-collapse: collapse; }
  .signature-table td {
    width: 50%;
    vertical-align: top;
    padding: 0 8px 0 0;
    background: transparent !important;
  }
  .signature-caption {
    margin: 0 0 4px;
    text-align: left;
    font-size: 8pt;
    color: var(--doc-muted) !important;
  }
  .signature-line, .date-line, .thumbprint-note {
    min-height: 18mm;
    border-bottom: 2px dashed var(--doc-muted);
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    padding-bottom: 2px;
    font-size: 8pt;
    color: var(--doc-muted) !important;
    background: transparent !important;
  }
  .signature-image {
    width: 100%;
    height: 18mm;
    object-fit: contain;
    border: 1px solid var(--doc-border);
    background: #fff !important;
  }

  .metadata {
    border: 1px solid var(--doc-brand-border);
    background: var(--doc-brand-soft) !important;
    padding: 12px 14px;
    margin-top: 16px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .metadata-table { width: 100%; border-collapse: collapse; }
  .metadata-table td {
    padding: 6px 10px 6px 0;
    vertical-align: top;
    width: 50%;
    background: transparent !important;
  }
  .metadata-label {
    font-weight: 700;
    color: var(--doc-muted) !important;
    display: block;
    font-size: 8pt;
    text-transform: uppercase;
  }
  .metadata-value {
    display: block;
    margin-top: 2px;
    font-size: 10pt;
    color: var(--doc-text) !important;
    word-break: break-word;
  }

  .footer {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 2px solid var(--doc-brand);
    text-align: center;
    font-size: 8pt;
    color: var(--doc-muted) !important;
    letter-spacing: 0.02em;
  }

  .legal-text {
    white-space: pre-wrap;
    margin: 8px 0 0;
    font-size: 9.5pt;
    line-height: 1.55;
    color: var(--doc-text) !important;
    overflow-wrap: anywhere;
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

  const body = `
    <div class="document">
      <div class="brand-bar" aria-hidden="true"></div>
      <header class="header">
        <p class="logo">WILMS</p>
        <p class="system">Women's Interest-Free Loan Management System</p>
        <p class="program">${escapeHtml(legal.programName)}</p>
        <h1>${escapeHtml(title)}</h1>
        <div class="header-meta">
          <div>
            <span>Registration reference</span>
            <strong>${escapeHtml(reference)}</strong>
          </div>
          <div>
            <span>Date generated</span>
            <strong>${escapeHtml(content.generatedAt)}</strong>
          </div>
          <div>
            <span>Application status</span>
            <strong>${escapeHtml(content.applicationStatus ?? 'Pending review')}</strong>
          </div>
          <div>
            <span>Registration officer</span>
            <strong>${escapeHtml(content.officerName)}</strong>
          </div>
        </div>
        <p class="instruction">${escapeHtml(legal.instructionText)}</p>
      </header>

      <section class="section">
        <h2 class="section-title">Applicant Information</h2>
        <div class="photo-row">${renderPhoto(content.borrowerPhotoUrl, 'Applicant passport photo', true)}</div>
        ${renderFieldTable(content.applicantRows)}
      </section>

      <section class="section">
        <h2 class="section-title">Work / Business Information</h2>
        ${renderFieldTable(content.workRows)}
      </section>

      <section class="section">
        <h2 class="section-title">Application Information</h2>
        ${renderFieldTable(content.applicationRows)}
      </section>

      <section class="section">
        <h2 class="section-title">Guarantor Information</h2>
        <table class="guarantor-layout keep-together" role="presentation">
          <tr>
            <td class="guarantor-photo-cell">${renderPhoto(content.guarantorPhotoUrl, 'Guarantor passport photo')}</td>
            <td>${renderFieldTable(content.guarantorRows)}</td>
          </tr>
        </table>
      </section>

      <section class="section">
        <h2 class="section-title">Documents</h2>
        ${renderFieldTable(content.documentRows)}
      </section>

      <section class="section declaration-box">
        <h3>Guarantor Declaration</h3>
        <p>${escapeHtml(legal.guarantorDeclaration)}</p>
        ${renderSignatureBlock('Guarantor', content.guarantorSignature, {
          showThumbprint: true,
          thumbprintDataUrl: content.guarantorThumbprint,
          dateLabel: content.signedDate,
        })}
      </section>

      <section class="section declaration-box">
        <h3>Borrower Declaration</h3>
        <p>${escapeHtml(legal.borrowerDeclaration)}</p>
        ${renderSignatureBlock('Borrower', content.borrowerSignature, {
          showThumbprint: true,
          thumbprintDataUrl: content.borrowerThumbprint,
          dateLabel: content.signedDate,
        })}
      </section>

      <section class="section">
        <h2 class="section-title">Key Terms &amp; Enforcement</h2>
        <p class="legal-text">${escapeHtml(legal.keyTerms)}</p>
      </section>

      <section class="section">
        <h2 class="section-title">Legal Notice</h2>
        <p class="legal-text">${escapeHtml(legal.legalNotice)}</p>
      </section>

      <section class="section">
        <h2 class="section-title">Officer Verification</h2>
        ${renderSignatureBlock(`Registration Officer — ${content.officerName}`, content.officerSignature, {
          dateLabel: content.signedDate,
        })}
      </section>

      <section class="metadata">
        <h2 class="section-title">Document Metadata</h2>
        <table class="metadata-table" role="presentation">
          <tr>
            <td><span class="metadata-label">Registration reference</span><span class="metadata-value">${escapeHtml(reference)}</span></td>
            <td><span class="metadata-label">Officer</span><span class="metadata-value">${escapeHtml(content.officerName)}</span></td>
          </tr>
          <tr>
            <td><span class="metadata-label">Signed / generated date</span><span class="metadata-value">${escapeHtml(content.signedDate)}</span></td>
            <td><span class="metadata-label">System</span><span class="metadata-value">WILMS Registration Module</span></td>
          </tr>
        </table>
      </section>

      <footer class="footer">
        WILMS · Women's Interest-Free Loan Management System · ${escapeHtml(title)} · A4 portrait · Pages continue automatically
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
