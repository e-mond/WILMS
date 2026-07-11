import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';

const PRIMARY = '0F6E56';
const MUTED = '5C5C5C';

export async function downloadRegistrationAgreementDocx(
  content: RegistrationAgreementContent,
  filename: string,
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    AlignmentType,
  } = await import('docx');

  const { legal } = content;

  const fieldTableRows = (rows: { label: string; value: string }[]) =>
    rows.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: row.label, bold: true, size: 18, color: MUTED })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: row.value || '—', size: 20 })],
                }),
              ],
            }),
          ],
        }),
    );

  const sectionTable = (title: string, rows: { label: string; value: string }[]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: PRIMARY },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: title, bold: true, size: 22, color: 'FFFFFF' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        ...fieldTableRows(rows),
      ],
    });

  const declarationBlock = (title: string, body: string) => [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: title, bold: true, size: 22, color: PRIMARY })],
    }),
    new Paragraph({
      children: [new TextRun({ text: body, size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Signature: ________________________________', size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Date: ${content.signedDate}`, size: 20 })],
      spacing: { after: 240 },
    }),
  ];

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'WILMS', bold: true, size: 40, color: PRIMARY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: legal.programName, bold: true, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: legal.formTitle, bold: true, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: legal.instructionText, size: 20, italics: true })],
    }),
    sectionTable('Applicant Information', content.applicantRows),
    new Paragraph({ spacing: { before: 200 } }),
    sectionTable('Work / Business Information', content.workRows),
    new Paragraph({ spacing: { before: 200 } }),
    sectionTable('Guarantor Information', content.guarantorRows),
    ...declarationBlock('Guarantor Declaration', legal.guarantorDeclaration),
    ...declarationBlock('Borrower Declaration', legal.borrowerDeclaration),
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: 'Key Terms & Enforcement', bold: true, size: 22, color: PRIMARY })],
    }),
    new Paragraph({
      children: [new TextRun({ text: legal.keyTerms, size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: 'Legal Notice', bold: true, size: 22, color: PRIMARY })],
    }),
    new Paragraph({
      children: [new TextRun({ text: legal.legalNotice, size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Officer Verification — ${content.officerName}`,
          bold: true,
          size: 22,
          color: PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Signature: ________________________________', size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Date: ${content.signedDate}`, size: 20 })],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
