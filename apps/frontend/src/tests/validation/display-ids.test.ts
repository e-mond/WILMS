import { describe, expect, it } from 'vitest';
import {
  formatBorrowerDisplayId,
  formatCollectorDisplayId,
  formatEntityDisplayId,
  formatLoanDisplayId,
  formatPaymentDisplayId,
  formatExpenseDisplayId,
  formatPoolDisplayId,
  isReadableWilmsId,
} from '@wilms/shared-utils';

describe('display id formatters', () => {
  it('formats borrower ids from community and registration month', () => {
    expect(
      formatBorrowerDisplayId(
        { community: 'Madina', registeredAt: '2026-05-15T10:00:00.000Z' },
        3,
      ),
    ).toBe('BWR-MADI-202605-0003');
  });

  it('formats payment ids from recorded date and sequence', () => {
    expect(formatPaymentDisplayId({ recordedAt: '2026-07-04', sequence: 2 })).toBe('TXN-20260704-002');
  });

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

  it('formats pool ids from year and sequence', () => {
    expect(
      formatPoolDisplayId({
        createdAt: '2026-03-01T00:00:00.000Z',
        sequence: 2,
      }),
    ).toBe('POOL-2026-002');
  });

  it('formats expense ids from year and sequence', () => {
    expect(formatExpenseDisplayId({ expenseDate: '2026-07-04', sequence: 42 })).toBe('EXP-2026-042');
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
