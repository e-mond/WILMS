import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: mocks.getDb,
}));

import { queryMissedPaymentAggregates } from '../../repositories/missed-payments.repository.js';
import { queryDefaulterAggregates } from '../../repositories/defaulter.repository.js';

describe('report aggregate repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDb.mockReturnValue({ execute: mocks.execute });
  });

  it('maps missed-payment CTE rows from SQL', async () => {
    mocks.execute.mockResolvedValue({
      rows: [
        {
          loan_id: 'loan-1',
          borrower_id: 'b-1',
          borrower_name: 'Ada',
          community: 'Accra',
          group_name: 'Group A',
          missed_weeks: 2,
          loan_balance_pesewas: 15000,
          last_payment_date: '2026-08-01',
          loan_status: 'ACTIVE',
        },
      ],
    });

    const result = await queryMissedPaymentAggregates();
    expect(result?.rows).toHaveLength(1);
    expect(result?.rows[0]).toMatchObject({
      loanId: 'loan-1',
      borrowerName: 'Ada',
      missedWeeks: 2,
      outstandingPesewas: 15000,
    });
    expect(result?.summary.totalMissedBorrowers).toBe(1);
  });

  it('returns null when missed-payment SQL fails so callers can fall back', async () => {
    mocks.execute.mockRejectedValue(new Error('SQL boom'));
    await expect(queryMissedPaymentAggregates()).resolves.toBeNull();
  });

  it('returns null when defaulter SQL fails so callers can fall back', async () => {
    mocks.execute.mockRejectedValue(new Error('SQL boom'));
    await expect(queryDefaulterAggregates()).resolves.toBeNull();
  });
});
