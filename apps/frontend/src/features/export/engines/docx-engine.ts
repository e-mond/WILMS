import type { WilmsExportDocument } from '@/features/export/types';
import { formatExportDate, formatExportTimestamp } from '@/features/export/utils/formatters';

export async function downloadWilmsDocx(
  document: WilmsExportDocument,
  filename: string,
): Promise<void> {
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = await import('docx');

  const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [
    new Paragraph({
      children: [new TextRun({ text: document.metadata.reportTitle, bold: true, size: 32 })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated ${formatExportTimestamp(new Date(document.metadata.generatedAt))} by ${document.metadata.generatedBy}`,
        }),
      ],
    }),
  ];

  if (document.executiveSummary) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: document.executiveSummary })] }),
    );
  }

  for (const section of document.sections) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.title, bold: true, size: 28 })],
      }),
    );

    if (section.summaryItems?.length) {
      for (const item of section.summaryItems) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${item.label}: ${item.value}` })],
          }),
        );
      }
    }

    if (section.table) {
      const headerRow = new TableRow({
        children: section.table.headers.map(
          (header) =>
            new TableCell({
              width: { size: 100 / section.table!.headers.length, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
            }),
        ),
      });

      const dataRows = section.table.rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: cell || '—' })] })],
                }),
            ),
          }),
      );

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
      );
    }

    if (section.content) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: section.content })] }),
      );
    }
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Report date: ${formatExportDate(document.metadata.generatedAt)}` })],
    }),
  );

  const doc = new Document({
    sections: [{ children }],
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
