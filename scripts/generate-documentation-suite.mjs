/**
 * Generate WILMS v1.7.3 documentation suite artefacts (PDF + DOCX).
 * Run from repo root: node scripts/generate-documentation-suite.mjs
 * Or: npm run docs:generate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docRoot = path.join(root, 'documentation');
const pdfDir = path.join(docRoot, 'pdf');
const docxDir = path.join(docRoot, 'docx');
const require = createRequire(path.join(root, 'apps/frontend/package.json'));

const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } = require('docx');
const { jsPDF } = require('jspdf');

const VERSION = '1.8.1';
const BRAND = { r: 15, g: 110, b: 86 };
const BRAND_HEX = '0F6E56';
const CONFIDENTIAL =
  'CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.';
const MERMAID_NOTE =
  '[Diagram: see markdown source for mermaid rendering. PDF export includes text content only.]';

/** @type {{ src: string; output: string; title?: string }[]} */
const DOC_MANIFEST = [
  { src: 'books/WILMS_PRODUCT_BOOK.md', output: 'WILMS_PRODUCT_BOOK', title: 'WILMS Product Book' },
  { src: 'books/FINANCIAL_ENGINE_BOOK.md', output: 'FINANCIAL_ENGINE_BOOK', title: 'Financial Engine Book' },
  { src: 'technical/TECHNICAL_ARCHITECTURE_GUIDE.md', output: 'TECHNICAL_ARCHITECTURE_GUIDE', title: 'Technical Architecture Guide' },
  { src: 'books/BUSINESS_REQUIREMENTS_BOOK.md', output: 'BUSINESS_REQUIREMENTS_BOOK', title: 'Business Requirements Book' },
  { src: 'operations/OPERATIONS_MANUAL.md', output: 'OPERATIONS_MANUAL', title: 'Operations Manual' },
  { src: 'user-guides/SUPER_ADMIN_MANUAL.md', output: 'ADMINISTRATOR_MANUAL', title: 'Administrator Manual' },
  { src: 'user-guides/COLLECTOR_MANUAL.md', output: 'COLLECTOR_MANUAL', title: 'Collector Manual' },
  { src: 'user-guides/OFFICER_MANUAL.md', output: 'OFFICER_MANUAL', title: 'Registration Officer Manual' },
  { src: 'user-guides/APPROVER_MANUAL.md', output: 'APPROVER_MANUAL', title: 'Approver Manual' },
  { src: 'user-guides/AUDITOR_MANUAL.md', output: 'AUDITOR_MANUAL', title: 'Auditor Manual' },
  { src: 'developer/DEVELOPER_GUIDE.md', output: 'DEVELOPER_GUIDE', title: 'Developer Guide' },
  { src: 'technical/API_REFERENCE.md', output: 'API_REFERENCE', title: 'API Reference' },
  { src: 'books/SECURITY_COMPLIANCE_BOOK.md', output: 'SECURITY_COMPLIANCE_BOOK', title: 'Security & Compliance Book' },
  { src: 'books/REPORTING_ANALYTICS_BOOK.md', output: 'REPORTING_ANALYTICS_BOOK', title: 'Reporting & Analytics Book' },
  { src: 'books/NOTIFICATION_COMMUNICATION_BOOK.md', output: 'NOTIFICATION_COMMUNICATION_BOOK', title: 'Notification & Communication Book' },
  { src: 'roadmap/ROADMAP_FUTURE_WORK_BOOK.md', output: 'ROADMAP_FUTURE_WORK_BOOK', title: 'Roadmap — Future Work' },
  { src: 'books/PRODUCT_DOSSIER.md', output: 'PRODUCT_DOSSIER', title: 'Product Dossier' },
  { src: 'books/BOARD_PRESENTATION.md', output: 'BOARD_PRESENTATION', title: 'Board Presentation' },
  { src: 'books/PROCUREMENT_PACK.md', output: 'PROCUREMENT_PACK', title: 'Procurement Pack' },
  { src: 'books/IMPLEMENTATION_GUIDE.md', output: 'IMPLEMENTATION_GUIDE', title: 'Implementation Guide' },
  {
    src: 'release/WILMS_v1.8.1_PRODUCTION_MAINTENANCE_REPORT.md',
    output: 'WILMS_v1.8.1_PRODUCTION_MAINTENANCE_REPORT',
    title: 'WILMS v1.8.1 Production Maintenance Report',
  },
  {
    src: 'release/WILMS_v1.8.0_FINAL_PRODUCTION_RELEASE_REPORT.md',
    output: 'WILMS_v1.8.0_FINAL_PRODUCTION_RELEASE_REPORT',
    title: 'WILMS v1.8.0 Final Production Release Report',
  },
  {
    src: 'release/MIGRATION_0044_VERIFICATION.md',
    output: 'MIGRATION_0044_VERIFICATION',
    title: 'Migration 0044 Verification',
  },
];

/**
 * Parse markdown into structured blocks for PDF/DOCX rendering.
 * @param {string} markdown
 * @returns {{ type: string; level?: number; text: string }[]}
 */
function parseMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  /** @type {{ type: string; level?: number; text: string }[]} */
  const blocks = [];
  let paragraph = [];
  let inCode = false;
  let codeLang = '';

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) {
      blocks.push({ type: 'paragraph', text: stripInline(text) });
    }
    paragraph = [];
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) {
        flushParagraph();
        inCode = true;
        codeLang = line.slice(3).trim();
        if (codeLang === 'mermaid') {
          blocks.push({ type: 'paragraph', text: MERMAID_NOTE });
        }
      } else {
        inCode = false;
        codeLang = '';
      }
      continue;
    }

    if (inCode) {
      if (codeLang !== 'mermaid') {
        paragraph.push(line);
      }
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: stripInline(heading[2]),
      });
      continue;
    }

    if (/^---+$/.test(line.trim()) || /^\|.+\|$/.test(line.trim())) {
      flushParagraph();
      if (/^\|.+\|$/.test(line.trim())) {
        blocks.push({ type: 'paragraph', text: stripInline(line.trim()) });
      }
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    if (/^[-*]\s+/.test(line.trim())) {
      flushParagraph();
      blocks.push({ type: 'paragraph', text: '• ' + stripInline(line.trim().replace(/^[-*]\s+/, '')) });
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  return blocks;
}

/** @param {string} text */
function stripInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^#+\s*/, '');
}

/**
 * @param {string} title
 * @param {{ type: string; level?: number; text: string }[]} blocks
 */
function buildDocx(title, blocks) {
  /** @type {import('docx').Paragraph[]} */
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'WILMS', bold: true, size: 56, color: BRAND_HEX })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Women's Interest-Free Loan Management System", size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: `${title} — v${VERSION}`, italics: true, size: 24 })],
    }),
  ];

  for (const block of blocks) {
    if (block.type === 'heading') {
      const level =
        block.level === 1
          ? HeadingLevel.HEADING_1
          : block.level === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;
      children.push(
        new Paragraph({
          heading: level,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: block.text, color: BRAND_HEX })],
        }),
      );
    } else {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: block.text, size: 22 })],
        }),
      );
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [new TextRun({ text: CONFIDENTIAL, italics: true, size: 18 })],
    }),
  );

  return new Document({
    creator: 'WILMS',
    title: `${title} v${VERSION}`,
    description: 'Official WILMS documentation',
    sections: [{ children }],
  });
}

/**
 * @param {string} title
 * @param {{ type: string; level?: number; text: string }[]} blocks
 */
function buildPdf(title, blocks) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = 0;

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(92, 92, 92);
    doc.text(CONFIDENTIAL, margin, pageHeight - 8, { maxWidth });
  };

  const newPageIfNeeded = (needed) => {
    if (y + needed > pageHeight - 18) {
      addFooter();
      doc.addPage();
      y = 20;
    }
  };

  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('WILMS', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text("Women's Interest-Free Loan Management System", pageWidth / 2, 32, { align: 'center' });
  doc.text(`${title} — v${VERSION}`, pageWidth / 2, 40, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  y = 62;

  for (const block of blocks) {
    if (block.type === 'heading') {
      newPageIfNeeded(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(block.level === 1 ? 14 : block.level === 2 ? 12 : 11);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      const hLines = doc.splitTextToSize(block.text, maxWidth);
      doc.text(hLines, margin, y);
      y += hLines.length * (block.level === 1 ? 7 : 6) + 2;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(block.text, maxWidth);
      newPageIfNeeded(lines.length * 5 + 4);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    }
  }

  addFooter();
  return doc;
}

async function main() {
  fs.mkdirSync(pdfDir, { recursive: true });
  fs.mkdirSync(docxDir, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const entry of DOC_MANIFEST) {
    const srcPath = path.join(docRoot, entry.src);
    const title = entry.title ?? entry.output.replace(/_/g, ' ');

    if (!fs.existsSync(srcPath)) {
      console.error('Missing source:', srcPath);
      failed += 1;
      continue;
    }

    const markdown = fs.readFileSync(srcPath, 'utf8');
    const blocks = parseMarkdown(markdown);

    try {
      const docx = buildDocx(title, blocks);
      const docxBuffer = await Packer.toBuffer(docx);
      const docxPath = path.join(docxDir, `${entry.output}.docx`);
      fs.writeFileSync(docxPath, docxBuffer);

      const pdf = buildPdf(title, blocks);
      const pdfPath = path.join(pdfDir, `${entry.output}.pdf`);
      fs.writeFileSync(pdfPath, Buffer.from(pdf.output('arraybuffer')));

      console.log('Generated:', entry.output, '(PDF + DOCX)');
      success += 1;
    } catch (error) {
      console.error('Failed:', entry.output, error);
      failed += 1;
    }
  }

  console.log('');
  console.log(`Documentation suite v${VERSION}: ${success} succeeded, ${failed} failed`);
  console.log(`PDF output:  ${pdfDir}`);
  console.log(`DOCX output: ${docxDir}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
