/**
 * Generate WILMS v1.7.2 product dossier artefacts (PDF + DOCX).
 * Run from repo root: node scripts/generate-product-dossier.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'v1.7.2');
const require = createRequire(path.join(root, 'apps/frontend/package.json'));

const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } = require('docx');
const { jsPDF } = require('jspdf');

const SECTIONS = [
  ['Executive Summary', 'WILMS v1.7.2 packages a production interest-free loan management platform for market presentation to government, NGO, and institutional partners.'],
  ['Product Overview', 'Women’s Interest-Free Loan Management System covering registration, approval, disbursement, collections, reconciliation, communications, executive intelligence, and operations.'],
  ['Problem Statement', 'Paper and spreadsheet programmes lack separation of duties, auditability, and timely portfolio visibility.'],
  ['Solution', 'A modular TypeScript monolith on Next.js + Vercel + Neon with RBAC, operational ledgers, notifications, and board reporting.'],
  ['Target Users', 'Collectors, officers, approvers, auditors, super admins, directors, MPs, NGO boards, procurement committees, and investors.'],
  ['Features', 'Borrower lifecycle, pools, collections, reconciliation, expenses, communication center, executive intelligence, exports, ops incidents.'],
  ['Architecture', 'Next.js App Router hosts @wilms/domain via Route Handlers; custom HMAC sessions; Neon PostgreSQL; optional Redis rate limits.'],
  ['BRD Summary', 'Interest-free group lending with maker-checker controls, field GPS collections, and programme capital hard-stops.'],
  ['Implemented Modules', 'Core lending through v1.7.0 intelligence/exports/ops; v1.7.2 market packaging and dashboard separation.'],
  ['Financial Model', 'Pesewas integer money; pool replenishment/disbursement/repayment/adjustment; expenses affect operating cash only.'],
  ['Security Model', 'HMAC sessions, RBAC + overrides, CSRF on mutating BFF paths, audit logging, upload allowlists.'],
  ['Operations', 'Health, metrics, cron notifications, incidents, maintenance windows, Neon backups.'],
  ['Deployment', 'Vercel production + Neon; migrations via domain SQL journal.'],
  ['Reporting', 'Operational reports, executive intelligence, forecasting, export center.'],
  ['Compliance', 'Audit trail, SoD on expenses/adjustments, confidentiality notices on exports.'],
  ['Testing', 'Vitest, Playwright, financial/RBAC/notification smokes, version and migration verifies.'],
  ['Certification Status', 'Production operational platform; statutory GL and multi-org deferred.'],
  ['Skipped / Deferred', 'Borrower portal, multi-organization tenancy, statutory GL, native mobile app, deep payment-provider integrations.'],
  ['Roadmap', 'v1.8 Integrations & Payments; v1.9 Enterprise automation; v2.0 General Ledger & multi-branch.'],
  ['Technical Appendix', 'Node 22, Next.js 14, Drizzle, shared-rbac, export engines (PDF/Excel/DOCX), docs/v1.7.2 release pack.'],
];

fs.mkdirSync(outDir, { recursive: true });

function buildDocx() {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'WILMS', bold: true, size: 56, color: '0F6E56' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Women's Interest-Free Loan Management System", size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'Product Dossier — v1.7.2', italics: true, size: 24 })],
    }),
  ];

  for (const [title, body] of SECTIONS) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(title)],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun(body)],
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: 'CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.',
          italics: true,
          size: 18,
        }),
      ],
    }),
  );

  return new Document({
    creator: 'WILMS',
    title: 'WILMS Product Dossier v1.7.2',
    description: 'Official product dossier for market readiness',
    sections: [{ children }],
  });
}

function buildPdf() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 110, 86);
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('WILMS', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text("Women's Interest-Free Loan Management System", pageWidth / 2, 32, { align: 'center' });
  doc.text('Product Dossier — v1.7.2', pageWidth / 2, 40, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  let y = 62;
  for (const [title, body] of SECTIONS) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 110, 86);
    doc.text(title, 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(body, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(92, 92, 92);
  doc.text(
    'CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.',
    14,
    287,
    { maxWidth: pageWidth - 28 },
  );
  return doc;
}

async function main() {
  const docx = buildDocx();
  const docxBuffer = await Packer.toBuffer(docx);
  const docxPath = path.join(outDir, 'PRODUCT_DOSSIER.docx');
  fs.writeFileSync(docxPath, docxBuffer);

  const pdf = buildPdf();
  const pdfPath = path.join(outDir, 'PRODUCT_DOSSIER.pdf');
  fs.writeFileSync(pdfPath, Buffer.from(pdf.output('arraybuffer')));

  // Companion one-pagers reused from dossier sections
  fs.writeFileSync(
    path.join(outDir, 'BRD_SUMMARY.pdf'),
    Buffer.from(buildPdf().output('arraybuffer')),
  );
  fs.copyFileSync(docxPath, path.join(outDir, 'FUTURE_ROADMAP.docx'));
  const roadmapPdf = buildPdf();
  fs.writeFileSync(path.join(outDir, 'FUTURE_ROADMAP.pdf'), Buffer.from(roadmapPdf.output('arraybuffer')));

  console.log('Wrote:', docxPath);
  console.log('Wrote:', pdfPath);
  console.log('Wrote companion BRD_SUMMARY.pdf and FUTURE_ROADMAP.pdf/.docx');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
