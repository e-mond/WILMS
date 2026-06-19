import { buildRegistrationAgreementPrintHtml } from '@/features/export/builders/registration-agreement-print-html';
import {
  WILMS_CONFIDENTIALITY_NOTICE,
  WILMS_EXPORT_COLORS,
  WILMS_EXPORT_FONTS,
  WILMS_ORG_FULL_NAME,
  WILMS_ORG_IDENTIFIER,
  WILMS_ORG_NAME,
} from '@/features/export/constants/branding';
import type { WilmsExportDocument, WilmsExportSection } from '@/features/export/types';

export type WilmsPrintFailureReason =
  | 'iframe_unavailable'
  | 'print_blocked'
  | 'unknown';

export type WilmsPrintResult =
  | { ok: true }
  | { ok: false; reason: WilmsPrintFailureReason };

const PRINT_FRAME_ID = 'wilms-print-frame';
const PREVIEW_ROOT_ID = 'wilms-print-preview-root';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSummarySection(section: WilmsExportSection): string {
  const rows = (section.summaryItems ?? [])
    .map(
      (item) =>
        `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${escapeHtml(item.value)}</td></tr>`,
    )
    .join('');

  return `
    <section class="wilms-section">
      <h2>${escapeHtml(section.title)}</h2>
      <table class="wilms-table wilms-summary-table">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderMetricsSection(section: WilmsExportSection): string {
  const cards = (section.metrics ?? [])
    .map(
      (metric) =>
        `<div class="wilms-metric"><span class="wilms-metric-label">${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong></div>`,
    )
    .join('');

  return `
    <section class="wilms-section">
      <h2>${escapeHtml(section.title)}</h2>
      <div class="wilms-metrics">${cards}</div>
    </section>
  `;
}

function renderTableSection(section: WilmsExportSection): string {
  const table = section.table!;
  const head = table.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('');
  const body = table.rows
    .map(
      (row, index) =>
        `<tr class="${index % 2 === 1 ? 'wilms-row-alt' : ''}">${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  const foot = table.totalsRow
    ? `<tfoot><tr>${table.totalsRow.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr></tfoot>`
    : '';

  return `
    <section class="wilms-section">
      <h2>${escapeHtml(section.title)}</h2>
      <table class="wilms-table">
        <caption>${escapeHtml(table.caption ?? section.title)}</caption>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
        ${foot}
      </table>
    </section>
  `;
}

function renderSection(section: WilmsExportSection): string {
  switch (section.type) {
    case 'summary':
      return renderSummarySection(section);
    case 'metrics':
      return renderMetricsSection(section);
    case 'table':
      return renderTableSection(section);
    case 'text':
      return `
        <section class="wilms-section">
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.content ?? '')}</p>
        </section>
      `;
    default:
      return '';
  }
}

export function buildWilmsPrintHtml(document: WilmsExportDocument): string {
  if (document.registrationAgreement) {
    return buildRegistrationAgreementPrintHtml(document.registrationAgreement);
  }

  const sections = document.sections.map(renderSection).join('');
  const signatures = document.signatures?.length
    ? `
      <section class="wilms-section">
        <h2>Authorized Signatures</h2>
        <div class="wilms-signatures">
          ${document.signatures
            .map(
              (signature) => `
                <div class="wilms-signature">
                  <p class="wilms-signature-label">${escapeHtml(signature.label)}</p>
                  <div class="wilms-signature-line"></div>
                  <p>${escapeHtml(signature.name ?? '')}</p>
                </div>
              `,
            )
            .join('')}
        </div>
      </section>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(document.metadata.reportTitle)} — ${escapeHtml(document.metadata.reportId)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
    <style>
      @page {
        size: A4 ${document.orientation === 'landscape' ? 'landscape' : 'portrait'};
        margin: 14mm 14mm 18mm 14mm;
        @bottom-center {
          content: "Page " counter(page);
          font-family: ${WILMS_EXPORT_FONTS.sans};
          font-size: 8pt;
          color: ${WILMS_EXPORT_COLORS.muted};
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: ${WILMS_EXPORT_COLORS.text};
        font-family: ${WILMS_EXPORT_FONTS.sans};
        font-size: 11pt;
        line-height: 1.5;
        background: #fff;
      }
      .wilms-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 16px 20px;
        background: ${WILMS_EXPORT_COLORS.primary};
        color: #fff;
      }
      .wilms-logo {
        font-family: ${WILMS_EXPORT_FONTS.serif};
        font-size: 28px;
        letter-spacing: 0.04em;
        margin: 0;
      }
      .wilms-org-name { margin: 4px 0 0; font-size: 10pt; opacity: 0.95; }
      .wilms-org-id { margin: 2px 0 0; font-size: 9pt; opacity: 0.85; }
      .wilms-header-meta { text-align: right; font-size: 10pt; }
      .wilms-header-meta h1 {
        margin: 0 0 8px;
        font-size: 14pt;
        font-weight: 700;
      }
      .wilms-meta-bar {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 12px 20px;
        border-bottom: 1px solid ${WILMS_EXPORT_COLORS.border};
        font-size: 9pt;
      }
      .wilms-meta-bar strong { display: block; color: ${WILMS_EXPORT_COLORS.muted}; font-weight: 600; }
      .wilms-content { padding: 20px; }
      .wilms-executive-summary {
        margin-bottom: 24px;
        padding: 16px;
        border-left: 4px solid ${WILMS_EXPORT_COLORS.accent};
        background: #faf8f4;
      }
      .wilms-executive-summary h2 {
        margin: 0 0 8px;
        font-size: 12pt;
        color: ${WILMS_EXPORT_COLORS.primary};
      }
      .wilms-section { margin-bottom: 24px; break-inside: avoid; }
      .wilms-section h2 {
        margin: 0 0 10px;
        font-size: 12pt;
        color: ${WILMS_EXPORT_COLORS.primary};
      }
      .wilms-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
      }
      .wilms-table caption {
        caption-side: top;
        text-align: left;
        margin-bottom: 8px;
        color: ${WILMS_EXPORT_COLORS.muted};
      }
      .wilms-table th,
      .wilms-table td {
        border: 1px solid ${WILMS_EXPORT_COLORS.border};
        padding: 8px 10px;
        vertical-align: top;
      }
      .wilms-table thead th {
        background: ${WILMS_EXPORT_COLORS.primary};
        color: #fff;
        font-weight: 700;
      }
      .wilms-summary-table th {
        width: 34%;
        background: #f5f7f6;
        text-align: left;
      }
      .wilms-row-alt { background: ${WILMS_EXPORT_COLORS.rowAlt}; }
      .wilms-table tfoot td {
        font-weight: 700;
        background: #eef3f1;
      }
      .wilms-metrics {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      .wilms-metric {
        padding: 12px;
        border: 1px solid ${WILMS_EXPORT_COLORS.border};
        background: #fff;
      }
      .wilms-metric-label {
        display: block;
        color: ${WILMS_EXPORT_COLORS.muted};
        font-size: 8pt;
        margin-bottom: 4px;
      }
      .wilms-signatures {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
      .wilms-signature-line {
        height: 48px;
        border-bottom: 1px solid ${WILMS_EXPORT_COLORS.text};
        margin: 12px 0 8px;
      }
      .wilms-footer {
        margin-top: 32px;
        padding-top: 12px;
        border-top: 2px solid ${WILMS_EXPORT_COLORS.primary};
        font-size: 8pt;
        color: ${WILMS_EXPORT_COLORS.muted};
      }
      .wilms-footer-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 4px;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <header class="wilms-header">
      <div>
        <p class="wilms-logo">${WILMS_ORG_NAME}</p>
        <p class="wilms-org-name">${escapeHtml(WILMS_ORG_FULL_NAME)}</p>
        <p class="wilms-org-id">${escapeHtml(WILMS_ORG_IDENTIFIER)}</p>
      </div>
      <div class="wilms-header-meta">
        <h1>${escapeHtml(document.metadata.reportTitle)}</h1>
        <div>Report ID: ${escapeHtml(document.metadata.reportId)}</div>
        <div>${escapeHtml(document.metadata.generatedAt)}</div>
      </div>
    </header>
    <div class="wilms-meta-bar">
      <div><strong>Generated By</strong>${escapeHtml(document.metadata.generatedBy)}</div>
      <div><strong>Environment</strong>${escapeHtml(document.metadata.environment)}</div>
      <div><strong>Report Type</strong>${escapeHtml(document.metadata.reportType)}</div>
    </div>
    <main class="wilms-content">
      <section class="wilms-executive-summary">
        <h2>Executive Summary</h2>
        <p>${escapeHtml(document.executiveSummary ?? 'Official WILMS export document.')}</p>
      </section>
      ${sections}
      ${signatures}
    </main>
    <footer class="wilms-footer">
      <div class="wilms-footer-row">
        <span>${WILMS_ORG_NAME}</span>
        <span>${escapeHtml(document.metadata.reportId)}</span>
      </div>
      <div>${WILMS_CONFIDENTIALITY_NOTICE} Generated on ${escapeHtml(document.metadata.generatedAt)}</div>
    </footer>
  </body>
</html>`;
}

function removePrintFrame(): void {
  window.document.getElementById(PRINT_FRAME_ID)?.remove();
}

function createPrintFrame(html: string): HTMLIFrameElement | null {
  removePrintFrame();

  const iframe = window.document.createElement('iframe');
  iframe.id = PRINT_FRAME_ID;
  iframe.setAttribute('title', 'WILMS print document');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });

  window.document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument ?? iframe.contentWindow?.document ?? null;

  if (!frameDocument) {
    removePrintFrame();
    return null;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  return iframe;
}

function invokePrint(frame: HTMLIFrameElement): WilmsPrintResult {
  const frameWindow = frame.contentWindow;

  if (!frameWindow) {
    removePrintFrame();
    return { ok: false, reason: 'iframe_unavailable' };
  }

  try {
    frameWindow.focus?.();
    frameWindow.print();
    window.setTimeout(removePrintFrame, 1500);
    return { ok: true };
  } catch {
    removePrintFrame();
    return { ok: false, reason: 'print_blocked' };
  }
}

function waitForPrintFrame(frame: HTMLIFrameElement): Promise<WilmsPrintResult> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: WilmsPrintResult) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    };

    const runPrint = () => finish(invokePrint(frame));

    frame.addEventListener('load', () => window.setTimeout(runPrint, 100), { once: true });
    window.setTimeout(runPrint, 750);
  });
}

export async function printWilmsDocument(exportDocument: WilmsExportDocument): Promise<WilmsPrintResult> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'iframe_unavailable' };
  }

  try {
    const html = buildWilmsPrintHtml(exportDocument);
    const frame = createPrintFrame(html);

    if (!frame) {
      return { ok: false, reason: 'iframe_unavailable' };
    }

    return waitForPrintFrame(frame);
  } catch {
    removePrintFrame();
    return { ok: false, reason: 'unknown' };
  }
}

export function openWilmsPrintPreview(exportDocument: WilmsExportDocument): WilmsPrintResult {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'iframe_unavailable' };
  }

  try {
    const html = buildWilmsPrintHtml(exportDocument);
    let root = window.document.getElementById(PREVIEW_ROOT_ID);

    if (!root) {
      root = window.document.createElement('div');
      root.id = PREVIEW_ROOT_ID;
      Object.assign(root.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '9999',
        background: 'rgba(0,0,0,0.55)',
        padding: '24px',
      });
      window.document.body.appendChild(root);
    }

    root.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
        <button type="button" id="wilms-print-preview-close" style="padding:8px 12px;border:0;border-radius:2px;background:#0F6E56;color:#fff;font-weight:600;cursor:pointer;">
          Close Preview
        </button>
      </div>
      <iframe title="WILMS print preview" style="width:100%;height:calc(100% - 48px);border:0;background:#fff;border-radius:2px;"></iframe>
    `;

    const iframe = root.querySelector('iframe');
    const closeButton = root.querySelector('#wilms-print-preview-close');

    if (!iframe) {
      return { ok: false, reason: 'iframe_unavailable' };
    }

    const frameDocument = iframe.contentDocument ?? iframe.contentWindow?.document ?? null;

    if (!frameDocument) {
      return { ok: false, reason: 'iframe_unavailable' };
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    closeButton?.addEventListener('click', () => root?.remove(), { once: true });

    return { ok: true };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}
