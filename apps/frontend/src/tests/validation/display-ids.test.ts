import { describe, expect, it } from 'vitest';
import {
  formatCollectorDisplayId,
  formatEntityDisplayId,
  formatLoanDisplayId,
  formatPoolDisplayId,
  isReadableWilmsId,
} from '@wilms/shared-utils';

describe('display id formatters', () => {
  it('formats collector codes from collectorCode or staffId', () => {
    expect(formatCollectorDisplayId({ collectorCode: 'col-011' })).toBe('COL-011');
    expect(formatCollectorDisplayId({ staffId: 'STF-204' })).toBe('STF-204');
    expect(formatCollectorDisplayId({ sequence: 3 })).toBe('COL-003');
  });

  it('formats loan ids from cycle batch and start date', () => {
    expect(
      formatLoanDisplayId({
        cycleBatch: 'Cycle 1 — January 2026',
        startDate: '2026-05-01',
        sequence: 2,
      }),
    ).toBe('LOAN-CYCLE1JA-202605-0002');
  });

  it('formats pool ids from region and sequence', () => {
    expect(
      formatPoolDisplayId({
        region: 'Greater Accra',
        name: 'Accra Metro Pool',
        sequence: 2,
      }),
    ).toBe('POOL-GRE-002');
  });

  it('formats entity ids and detects readable WILMS ids', () => {
    expect(
      formatEntityDisplayId({
        entityType: 'BORROWER',
        entityId: '01930001-0001-7000-8000-000000000001',
        entityName: 'Akosua Mensah',
      }),
    ).toMatch(/^ENT-BOR-AKOS-/);

    expect(isReadableWilmsId('GRP-MAD-202603-001')).toBe(true);
    expect(isReadableWilmsId('01930001-0001-7000-8000-000000000001')).toBe(false);
  });
});
