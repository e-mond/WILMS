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

export function buildExportFilename(resourceName: string, extension: string, date: Date = new Date()): string {
  const dateKey = date.toISOString().slice(0, 10);
  const normalizedExtension = extension.replace(/^\./, '');
  const safeResource = resourceName.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'Export';
  return `${safeResource}_${dateKey}.${normalizedExtension}`;
}

/** @deprecated Use formatPesewasForExport from the export framework. */
export function formatPesewasForCsv(pesewas: number): string {
  return (pesewas / 100).toFixed(2);
}
