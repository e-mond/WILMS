import type { RegistrationAgreementContent } from '@/utils/registration-agreement-fields';

const PRIMARY = '0F6E56';
const MUTED = '5C5C5C';
const LIGHT_FILL = 'F7FAF8';

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
    BorderStyle,
    Header,
    Footer,
    PageNumber,
  } = await import('docx');

  const { legal } = content;
  const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 8,
    color: 'C9E0D7',
  };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
  const headerBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
  };

  const fieldTableRows = (rows: { label: string; value: string }[]) =>
    rows.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({
                      text: row.label.toUpperCase(),
                      bold: true,
                      size: 16,
                      color: MUTED,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
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
              borders: headerBorders,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 80, after: 80 },
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
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: LIGHT_FILL },
              borders: cellBorders,
              children: [
                new Paragraph({
                  spacing: { before: 120, after: 80 },
                  children: [new TextRun({ text: title, bold: true, size: 22, color: PRIMARY })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: body, size: 20 })],
                  spacing: { after: 120 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Signature: ________________________________', size: 20 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Date: ${content.signedDate}`, size: 20 })],
                  spacing: { after: 120 },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: 'WILMS', bold: true, size: 44, color: PRIMARY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "Women's Interest-Free Loan Management System",
          size: 18,
          color: MUTED,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: legal.programName, bold: true, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: content.documentTitle || legal.formTitle, bold: true, size: 28, color: PRIMARY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `Reference: ${content.registrationReference ?? 'Pending assignment'} · ${content.applicationStatus ?? 'Pending review'}`,
          size: 18,
          color: MUTED,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: legal.instructionText, size: 20 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [new TextRun({ text: legal.programDeclaration, size: 18, italics: true, color: MUTED })],
    }),
    sectionTable('Applicant Information', content.applicantRows),
    new Paragraph({ spacing: { before: 240 } }),
    sectionTable('Work / Business Information', content.workRows),
    new Paragraph({ spacing: { before: 240 } }),
    sectionTable('Application Information', content.applicationRows),
    new Paragraph({ spacing: { before: 240 } }),
    sectionTable('Guarantor Information', content.guarantorRows),
    new Paragraph({ spacing: { before: 240 } }),
    sectionTable('Documents', content.documentRows),
    new Paragraph({ spacing: { before: 240 } }),
    ...declarationBlock('Guarantor Declaration', legal.guarantorDeclaration),
    new Paragraph({ spacing: { before: 200 } }),
    ...declarationBlock('Borrower Declaration', legal.borrowerDeclaration),
    new Paragraph({
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: 'Key Terms & Enforcement', bold: true, size: 24, color: PRIMARY })],
    }),
    new Paragraph({
      children: [new TextRun({ text: legal.keyTerms, size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: 'Legal Notice', bold: true, size: 24, color: PRIMARY })],
    }),
    new Paragraph({
      children: [new TextRun({ text: legal.legalNotice, size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      spacing: { before: 160, after: 80 },
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
      spacing: { after: 200 },
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
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'WILMS Registration Agreement',
                    size: 16,
                    color: PRIMARY,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "WILMS · Women's Interest-Free Loan Management System · Page ",
                    size: 16,
                    color: MUTED,
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
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
