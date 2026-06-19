import { describe, expect, it } from 'vitest';
import { buildCsvContent, escapeCsvCell } from '@/utils/export-csv';

describe('export-csv', () => {
  it('escapes commas and quotes in CSV cells', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('value, with comma')).toBe('"value, with comma"');
    expect(escapeCsvCell('say "hello"')).toBe('"say ""hello"""');
  });

  it('builds CSV content with headers and rows', () => {
    const content = buildCsvContent(
      ['Name', 'Amount'],
      [
        ['Ama Mensah', '50.00'],
        ['Hope, Circle', '25.00'],
      ],
    );

    expect(content).toBe(['Name,Amount', 'Ama Mensah,50.00', '"Hope, Circle",25.00'].join('\n'));
  });
});
