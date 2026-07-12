import { describe, expect, it } from 'vitest';
import { buildCycleBatchFilterOptions } from '@/utils/cycle-batch-options';

describe('buildCycleBatchFilterOptions', () => {
  it('includes preset cycles and custom labels from portfolio data', () => {
    const options = buildCycleBatchFilterOptions([
      { cycleBatch: 'Cycle 5 — January 2027' },
      { cycleBatch: 'Cycle 4 — October 2025' },
    ]);

    expect(options[0]).toEqual({ value: '', label: 'All cycles' });
    expect(options.some((option) => option.value === 'Cycle 1 — January 2026')).toBe(true);
    expect(options.some((option) => option.value === 'Cycle 5 — January 2027')).toBe(true);
    expect(options.some((option) => option.value === 'Cycle 4 — October 2025')).toBe(true);
  });
});
