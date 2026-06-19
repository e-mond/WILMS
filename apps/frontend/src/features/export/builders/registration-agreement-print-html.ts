import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFieldGrid(rows: { label: string; value: string }[]): string {
  return rows
    .map(
      (row) =>
        `<div class="field"><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`,
    )
    .join('');
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
    <div class="signature-block">
      <p class="signature-label">${escapeHtml(label)}</p>
      <div class="signature-grid">
        <div><p class="signature-caption">Signature</p>${signature}</div>
        ${options.showThumbprint ? `<div><p class="signature-caption">Thumbprint</p>${thumbprint}</div>` : ''}
      </div>
      <div><p class="signature-caption">Date</p><div class="date-line">${escapeHtml(options.dateLabel)}</div></div>
    </div>
  `;
}

const REGISTRATION_PRINT_STYLES = `
  @page { size: A4 portrait; margin: 10mm 12mm 14mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #1a1a1a; font-family: "DM Sans", system-ui, sans-serif; font-size: 9.5pt; line-height: 1.45; }
  .page { break-inside: avoid; }
  .page-break { break-after: page; page-break-after: always; }
  .header { border-bottom: 2px solid #0f6e56; padding-bottom: 10px; text-align: center; }
  .header .logo { font-family: "DM Serif Display", Georgia, serif; font-size: 22pt; letter-spacing: 0.18em; color: #0f6e56; margin: 0; }
  .header .program { margin: 6px 0 0; font-size: 10pt; font-weight: 600; text-transform: uppercase; }
  .header h1 { margin: 8px 0 0; font-size: 13pt; font-weight: 700; text-transform: uppercase; }
  .header .instruction { margin: 10px auto 0; max-width: 95%; font-size: 9pt; }
  .header .declaration { margin: 8px auto 0; max-width: 95%; font-size: 8.5pt; font-style: italic; color: #5c5c5c; }
  .section { margin-top: 14px; }
  .section-title { border-bottom: 1px solid #d3d1c7; padding-bottom: 4px; margin: 0 0 8px; text-align: center; font-size: 10.5pt; font-weight: 700; text-transform: uppercase; color: #0f6e56; }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
  .field { border-bottom: 1px solid #eceae3; padding-bottom: 4px; }
  .field dt { margin: 0; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; color: #5c5c5c; }
  .field dd { margin: 2px 0 0; font-size: 9pt; }
  .photo-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 8px 0; }
  .photo-passport { width: 28mm; height: 36mm; object-fit: cover; border: 2px solid #0f6e56; }
  .photo-guarantor { width: 24mm; height: 30mm; object-fit: cover; border: 1px solid #d3d1c7; }
  .photo-placeholder { display: flex; align-items: center; justify-content: center; width: 28mm; height: 36mm; border: 2px dashed #0f6e56; font-size: 8pt; color: #5c5c5c; }
  .guarantor-row { display: flex; gap: 12px; align-items: flex-start; }
  .guarantor-row .field-grid { flex: 1; }
  .declaration-box { border: 1px solid #d3d1c7; background: #faf9f6; padding: 10px; margin-top: 10px; }
  .declaration-box h3 { margin: 0 0 6px; text-align: center; font-size: 9.5pt; text-transform: uppercase; color: #0f6e56; }
  .signature-block { margin-top: 8px; }
  .signature-label { text-align: center; font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #5c5c5c; margin: 0 0 6px; }
  .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .signature-caption { margin: 0 0 4px; text-align: center; font-size: 8pt; color: #5c5c5c; }
  .signature-line, .date-line, .thumbprint-note { min-height: 18mm; border-bottom: 2px dashed #5c5c5c; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px; font-size: 8pt; color: #5c5c5c; }
  .signature-image { width: 100%; height: 18mm; object-fit: contain; border: 1px solid #d3d1c7; background: #fff; }
  .metadata { border: 1px solid #d3d1c7; background: #faf9f6; padding: 10px; margin-top: 12px; }
  .metadata dl { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin: 8px 0 0; }
  .metadata dt { font-weight: 700; color: #5c5c5c; }
  .metadata dd { margin: 0; }
  .footer { margin-top: 12px; padding-top: 8px; border-top: 1px solid #d3d1c7; text-align: center; font-size: 7.5pt; color: #5c5c5c; }
  .legal-text { white-space: pre-wrap; margin: 6px 0 0; font-size: 9pt; }
`;

export function buildRegistrationAgreementPrintHtml(content: RegistrationAgreementContent): string {
  const { legal } = content;

  const pageOne = `
    <div class="page page-break">
      <header class="header">
        <p class="logo">WILMS</p>
        <p class="program">${escapeHtml(legal.programName)}</p>
        <h1>${escapeHtml(legal.formTitle)}</h1>
        <p class="instruction">${escapeHtml(legal.instructionText)}</p>
        <p class="declaration">${escapeHtml(legal.programDeclaration)}</p>
      </header>

      <section class="section">
        <h2 class="section-title">Applicant Information</h2>
        <div class="photo-row">${renderPhoto(content.borrowerPhotoUrl, 'Applicant passport photo', true)}</div>
        <div class="field-grid">${renderFieldGrid(content.applicantRows)}</div>
      </section>

      <section class="section">
        <h2 class="section-title">Work / Business Information</h2>
        <div class="field-grid">${renderFieldGrid(content.workRows)}</div>
      </section>

      <section class="section">
        <h2 class="section-title">Guarantor Information</h2>
        <div class="guarantor-row">
          ${renderPhoto(content.guarantorPhotoUrl, 'Guarantor passport photo')}
          <div class="field-grid">${renderFieldGrid(content.guarantorRows)}</div>
        </div>
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
    </div>
  `;

  const pageTwo = `
    <div class="page">
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
        <h2 class="section-title">Document Metadata &amp; Audit Information</h2>
        <dl>
          <div><dt>Officer</dt><dd>${escapeHtml(content.officerName)}</dd></div>
          <div><dt>Signed date</dt><dd>${escapeHtml(content.signedDate)}</dd></div>
          <div><dt>Form version</dt><dd>${escapeHtml(legal.formTitle)}</dd></div>
          <div><dt>System</dt><dd>WILMS Registration Module</dd></div>
        </dl>
      </section>

      <footer class="footer">
        WILMS · Women&apos;s Interest-Free Loan Management System · Registration Agreement · Page 2 of 2
      </footer>
    </div>
  `;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>${escapeHtml(legal.formTitle)}</title><style>${REGISTRATION_PRINT_STYLES}</style></head><body>${pageOne}${pageTwo}</body></html>`;
}
