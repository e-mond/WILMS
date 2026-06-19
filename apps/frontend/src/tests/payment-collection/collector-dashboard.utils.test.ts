import { describe, expect, it } from 'vitest';
import {
  COLLECTOR_PAYMENT_STATUS,
  RECONCILIATION_STATUS,
} from '@/types/collector-dashboard';
import {
  buildCollectorDashboard,
  getWeekdayNameFromIsoDate,
  isLoanDueOnDate,
} from '@/features/payment-collection/collector-dashboard.utils';

describe('collector-dashboard.utils', () => {
  it('resolves weekday names from ISO dates', () => {
    expect(getWeekdayNameFromIsoDate('2026-05-23')).toBe('Saturday');
    expect(getWeekdayNameFromIsoDate('2026-05-22')).toBe('Friday');
  });

  it('identifies loans due on the matching payment day', () => {
    expect(isLoanDueOnDate('Friday', '2026-05-22')).toBe(true);
    expect(isLoanDueOnDate('Monday', '2026-05-22')).toBe(false);
  });

  it('builds expected vs collected summary for due borrowers', () => {
    const dashboard = buildCollectorDashboard({
      referenceDate: '2026-05-22',
      collectorId: 'user-collector',
      loans: [
        {
          id: 'loan-001',
          borrowerId: 'borrower-001',
          borrowerName: 'Ama Mensah',
          phone: '+233241234567',
          community: 'Madina',
          groupName: 'Sunrise Women',
          weeklyPaymentPesewas: 5000,
          paymentDay: 'Friday',
          missedWeeks: 1,
        },
      ],
      payments: [
        {
          borrowerId: 'borrower-001',
          amountPesewas: 5000,
          collectorId: 'user-collector',
          paymentDate: '2026-05-22',
        },
      ],
      reconciliation: {
        expectedPesewas: 5000,
        actualPesewas: 5000,
        variancePesewas: 0,
        submitted: true,
      },
    });

    expect(dashboard.summary).toMatchObject({
      borrowersDueCount: 1,
      expectedPesewas: 5000,
      collectedPesewas: 5000,
      collectionRatePercent: 100,
      missedAlertsCount: 1,
      reconciliationStatus: RECONCILIATION_STATUS.COMPLETE,
    });
    expect(dashboard.borrowers[0]).toMatchObject({
      paymentStatus: COLLECTOR_PAYMENT_STATUS.COLLECTED,
    });
    expect(dashboard.missedAlerts).toHaveLength(1);
  });
});
