export function formatPesewasForExport(pesewas: number): string {
  return `GHS ${(pesewas / 100).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentForExport(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatExportTimestamp(value: Date = new Date()): string {
  return value.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function formatExportDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function slugExportToken(value: string): string {
  return value.replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'Document';
}

/** Branded download stem without extension. */
export function buildBrandedExportFilenameBase(parts: Array<string | null | undefined>): string {
  return buildBrandedExportFilename(parts, 'pdf').replace(/\.pdf$/i, '');
}

/**
 * Branded download name without a trailing date unless supplied as a part.
 * Example: WILMS_Borrower_Profile_Gloria_Serwaa_BRW-2026-00417.pdf
 */
export function buildBrandedExportFilename(
  parts: Array<string | null | undefined>,
  extension: string,
): string {
  const tokens = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .map(slugExportToken);
  const body = tokens.join('_') || 'Export';
  const branded = body.startsWith('WILMS_') ? body : `WILMS_${body}`;
  return `${branded}.${extension.replace(/^\./, '')}`;
}

export function buildExportFilename(resourceName: string, extension: string, date?: Date): string {
  const branded = buildBrandedExportFilename(
    date ? [resourceName, date.toISOString().slice(0, 10)] : [resourceName],
    extension,
  );
  return branded;
}

/** @deprecated Use formatPesewasForExport from the export framework. */
export function formatPesewasForCsv(pesewas: number): string {
  return (pesewas / 100).toFixed(2);
}
