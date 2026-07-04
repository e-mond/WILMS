import { describe, expect, it } from 'vitest';
import { buildExportFilename } from '@/features/export/utils/formatters';

describe('buildExportFilename', () => {
  it('uses resource name and ISO date', () => {
    expect(buildExportFilename('Audit Log', 'csv', new Date('2026-07-04T12:00:00.000Z'))).toBe(
      'Audit-Log_2026-07-04.csv',
    );
  });
});
