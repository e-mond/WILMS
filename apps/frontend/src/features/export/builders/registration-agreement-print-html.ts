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

      return `<tr>${cells}${filler}</tr>`;
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
    <div class="signature-block">
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

const REGISTRATION_PRINT_STYLES = `
  @page { size: A4 portrait; margin: 10mm 12mm 14mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #1a1a1a; font-family: "DM Sans", Arial, sans-serif; font-size: 9pt; line-height: 1.4; }
  .page { break-inside: avoid; }
  .page-break { break-after: page; page-break-after: always; }
  .header { border-bottom: 2px solid #0f6e56; padding-bottom: 10px; text-align: center; }
  .header .logo { font-family: Georgia, serif; font-size: 22pt; letter-spacing: 0.18em; color: #0f6e56; margin: 0; }
  .header .program { margin: 6px 0 0; font-size: 10pt; font-weight: 700; text-transform: uppercase; }
  .header h1 { margin: 8px 0 0; font-size: 13pt; font-weight: 700; text-transform: uppercase; }
  .header .instruction { margin: 10px auto 0; max-width: 95%; font-size: 9pt; }
  .header .declaration { margin: 8px auto 0; max-width: 95%; font-size: 8.5pt; font-style: italic; color: #5c5c5c; }
  .section { margin-top: 12px; break-inside: avoid; }
  .section-title { border-bottom: 1px solid #d3d1c7; padding-bottom: 4px; margin: 0 0 8px; text-align: center; font-size: 10.5pt; font-weight: 700; text-transform: uppercase; color: #0f6e56; }
  .field-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .field-cell { width: 50%; vertical-align: top; padding: 4px 8px 8px 0; border-bottom: 1px solid #eceae3; }
  .field-cell-empty { border-bottom: none; }
  .field-label { display: block; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; color: #5c5c5c; margin-bottom: 2px; }
  .field-value { display: block; font-size: 9pt; color: #1a1a1a; word-break: break-word; white-space: pre-wrap; }
  .photo-row { text-align: center; margin: 8px 0; }
  .photo-passport { width: 28mm; height: 36mm; object-fit: cover; border: 2px solid #0f6e56; }
  .photo-guarantor { width: 24mm; height: 30mm; object-fit: cover; border: 1px solid #d3d1c7; }
  .photo-placeholder { display: inline-flex; align-items: center; justify-content: center; width: 28mm; height: 36mm; border: 2px dashed #0f6e56; font-size: 8pt; color: #5c5c5c; }
  .guarantor-layout { width: 100%; border-collapse: collapse; }
  .guarantor-layout td { vertical-align: top; }
  .guarantor-photo-cell { width: 30mm; padding-right: 10px; }
  .declaration-box { border: 1px solid #d3d1c7; background: #faf9f6; padding: 10px; margin-top: 10px; break-inside: avoid; }
  .declaration-box h3 { margin: 0 0 6px; text-align: center; font-size: 9.5pt; text-transform: uppercase; color: #0f6e56; }
  .signature-block { margin-top: 8px; }
  .signature-label { text-align: center; font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #5c5c5c; margin: 0 0 6px; }
  .signature-table { width: 100%; border-collapse: collapse; }
  .signature-table td { width: 50%; vertical-align: top; padding: 0 6px; }
  .signature-caption { margin: 0 0 4px; text-align: center; font-size: 8pt; color: #5c5c5c; }
  .signature-line, .date-line, .thumbprint-note { min-height: 16mm; border-bottom: 2px dashed #5c5c5c; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px; font-size: 8pt; color: #5c5c5c; }
  .signature-image { width: 100%; height: 16mm; object-fit: contain; border: 1px solid #d3d1c7; background: #fff; }
  .metadata { border: 1px solid #d3d1c7; background: #faf9f6; padding: 10px; margin-top: 12px; }
  .metadata-table { width: 100%; border-collapse: collapse; }
  .metadata-table td { padding: 4px 8px 4px 0; vertical-align: top; width: 50%; }
  .metadata-label { font-weight: 700; color: #5c5c5c; display: block; font-size: 8pt; }
  .metadata-value { display: block; margin-top: 2px; }
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
        ${renderFieldTable(content.applicantRows)}
      </section>

      <section class="section">
        <h2 class="section-title">Work / Business Information</h2>
        ${renderFieldTable(content.workRows)}
      </section>

      <section class="section">
        <h2 class="section-title">Guarantor Information</h2>
        <table class="guarantor-layout" role="presentation">
          <tr>
            <td class="guarantor-photo-cell">${renderPhoto(content.guarantorPhotoUrl, 'Guarantor passport photo')}</td>
            <td>${renderFieldTable(content.guarantorRows)}</td>
          </tr>
        </table>
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
        <table class="metadata-table" role="presentation">
          <tr>
            <td><span class="metadata-label">Officer</span><span class="metadata-value">${escapeHtml(content.officerName)}</span></td>
            <td><span class="metadata-label">Signed date</span><span class="metadata-value">${escapeHtml(content.signedDate)}</span></td>
          </tr>
          <tr>
            <td><span class="metadata-label">Form version</span><span class="metadata-value">${escapeHtml(legal.formTitle)}</span></td>
            <td><span class="metadata-label">System</span><span class="metadata-value">WILMS Registration Module</span></td>
          </tr>
        </table>
      </section>

      <footer class="footer">
        WILMS · Women&apos;s Interest-Free Loan Management System · Registration Agreement · Page 2 of 2
      </footer>
    </div>
  `;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>${escapeHtml(legal.formTitle)}</title><style>${REGISTRATION_PRINT_STYLES}</style></head><body>${pageOne}${pageTwo}</body></html>`;
}
