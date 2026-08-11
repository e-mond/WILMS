import { describe, expect, it, vi } from 'vitest';
import { COLLECTOR_PAYMENT_STATUS } from '@/types/collector-dashboard';
import {
  applySelectAllChoice,
  buildInitialSheetMembers,
  isSheetRowLocked,
  resolveSheetAmountPesewas,
  setMemberChoice,
  submitGroupCollectionBatch,
  type SheetMember,
} from '@/features/payment-collection/group-collection-sheet.utils';

const gps = {
  latitude: 5.6,
  longitude: -0.2,
  capturedAt: '2026-08-04T12:00:00.000Z',
};

function member(overrides: Partial<SheetMember> = {}): SheetMember {
  return {
    borrowerId: 'b1',
    borrowerName: 'Ama',
    loanId: 'loan-1',
    expectedPesewas: 5000,
    weeklyPaymentPesewas: 5000,
    payableWeeksCount: 1,
    choice: 'UNSET',
    recorded: 'NONE',
    ...overrides,
  };
}

describe('group-collection-sheet.utils', () => {
  it('resolves payment mode amounts', () => {
    expect(resolveSheetAmountPesewas(member(), 'NORMAL')).toEqual({
      amountPesewas: 5000,
      weeksCount: 1,
    });
    expect(
      resolveSheetAmountPesewas(member({ payableWeeksCount: 3, expectedPesewas: 15_000 }), 'DOUBLE'),
    ).toEqual({ amountPesewas: 10_000, weeksCount: 2 });
    expect(
      resolveSheetAmountPesewas(member({ payableWeeksCount: 3, expectedPesewas: 15_000 }), 'ALL'),
    ).toEqual({ amountPesewas: 15_000, weeksCount: 3 });
  });

  it('filters members by group and greys collected/missed rows', () => {
    const members = buildInitialSheetMembers(
      [
        {
          borrowerId: 'b1',
          borrowerName: 'Ama',
          phone: '1',
          community: 'Madina',
          groupId: 'g1',
          groupName: 'Sunrise',
          loanId: 'l1',
          expectedPesewas: 5000,
          collectedPesewas: 5000,
          paymentStatus: COLLECTOR_PAYMENT_STATUS.COLLECTED,
        },
        {
          borrowerId: 'b2',
          borrowerName: 'Efua',
          phone: '2',
          community: 'Madina',
          groupId: 'g1',
          groupName: 'Sunrise',
          loanId: 'l2',
          expectedPesewas: 5000,
          collectedPesewas: 0,
          paymentStatus: COLLECTOR_PAYMENT_STATUS.PENDING,
        },
        {
          borrowerId: 'b3',
          borrowerName: 'Other',
          phone: '3',
          community: 'Madina',
          groupId: 'g2',
          groupName: 'Other',
          loanId: 'l3',
          expectedPesewas: 5000,
          collectedPesewas: 0,
          paymentStatus: COLLECTOR_PAYMENT_STATUS.PENDING,
        },
      ],
      'g1',
    );

    expect(members).toHaveLength(2);
    expect(isSheetRowLocked(members[0]!)).toBe(true);
    expect(isSheetRowLocked(members[1]!)).toBe(false);
  });

  it('selects all unset unlocked rows as Paid', () => {
    const next = applySelectAllChoice(
      [
        member({ borrowerId: 'b1', recorded: 'COLLECTED' }),
        member({ borrowerId: 'b2' }),
        member({ borrowerId: 'b3', choice: 'MISSED' }),
      ],
      'PAID',
    );

    expect(next[0]!.choice).toBe('UNSET');
    expect(next[1]!.choice).toBe('PAID');
    expect(next[2]!.choice).toBe('MISSED');
  });

  it('submits paid and missed rows and continues after row errors', async () => {
    const recordPayment = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Duplicate payment'));
    const markMissedPayment = vi.fn().mockResolvedValue({});

    const result = await submitGroupCollectionBatch(
      [
        member({ borrowerId: 'b1', choice: 'PAID' }),
        member({ borrowerId: 'b2', choice: 'PAID' }),
        member({ borrowerId: 'b3', choice: 'MISSED', loanId: 'loan-3' }),
        member({ borrowerId: 'b4', recorded: 'COLLECTED', choice: 'PAID' }),
      ],
      {
        collectorId: 'collector-1',
        paymentDate: '2026-08-04',
        paymentMode: 'NORMAL',
        gps,
        recordPayment,
        markMissedPayment,
      },
    );

    expect(recordPayment).toHaveBeenCalledTimes(2);
    expect(markMissedPayment).toHaveBeenCalledWith(
      expect.objectContaining({ borrowerId: 'b3', loanId: 'loan-3' }),
    );
    expect(result.paidCount).toBe(1);
    expect(result.missedCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.members[0]!.recorded).toBe('COLLECTED');
    expect(result.members[1]!.rowError).toContain('Duplicate');
    expect(result.members[2]!.recorded).toBe('MISSED');
    expect(isSheetRowLocked(result.members[3]!)).toBe(true);
  });

  it('ignores locked rows when setting choice', () => {
    const next = setMemberChoice(
      [member({ recorded: 'MISSED' })],
      'b1',
      'PAID',
    );
    expect(next[0]!.choice).toBe('UNSET');
  });
});
