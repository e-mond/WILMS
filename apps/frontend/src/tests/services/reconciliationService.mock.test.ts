import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/mock/delay', () => ({
  simulateDelay: async () => undefined,
}));

import { AUDIT_ACTION } from '@/constants/audit';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import { getMockSupervisorAlerts, resetMockSupervisorAlerts } from '@/services/mock/notificationService.mock';
import { resetPaymentTransactions } from '@/services/mock/payment-transaction.store';
import reconciliationServiceMock, {
  resetMockReconciliationSubmissions,
} from '@/services/mock/reconciliationService.mock';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';
import { getAuditEntries, resetAuditLog } from '@/services/mock/audit-log.store';
import { ApiError } from '@/types/api';

describe('reconciliationService.mock', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetPaymentTransactions();
    resetMockReconciliationSubmissions();
    resetMockSupervisorAlerts();
    resetAuditLog();
  });

  it('returns computed totals before submission', async () => {
    const summary = await reconciliationServiceMock.getCollectorReconciliation(
      'user-collector',
      '2026-05-29',
    );

    expect(summary).toMatchObject({
      collectorId: 'user-collector',
      date: '2026-05-29',
      expectedPesewas: 11000,
      actualPesewas: 0,
      submitted: false,
      variancePesewas: -11000,
    });
  });

  it('submits reconciliation, locks the date, and audits the action', async () => {
    const summary = await reconciliationServiceMock.submitReconciliation({
      collectorId: 'user-collector',
      date: '2026-05-29',
      physicalCashPesewas: 11000,
    });

    expect(summary).toMatchObject({
      submitted: true,
      physicalCashPesewas: 11000,
      actualPesewas: 0,
      variancePesewas: 0,
      varianceFlagged: false,
    });

    const auditEntry = getAuditEntries().find(
      (entry) => entry.action === AUDIT_ACTION.RECONCILIATION_SUBMITTED,
    );

    expect(auditEntry).toMatchObject({
      actorId: 'user-collector',
      targetEntityId: 'user-collector:2026-05-29',
    });
  });

  it('alerts supervisors when variance exceeds the threshold', async () => {
    await reconciliationServiceMock.submitReconciliation({
      collectorId: 'user-collector',
      date: '2026-05-29',
      physicalCashPesewas: 4000,
      comment: 'Collector held less cash than expected due to delayed collections.',
    });

    const alerts = getMockSupervisorAlerts().filter((alert) =>
      alert.paymentId.startsWith('reconciliation-'),
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      collectorId: 'user-collector',
      paymentId: 'reconciliation-user-collector-2026-05-29',
    });
  });

  it('rejects flagged variance without a comment', async () => {
    await expect(
      reconciliationServiceMock.submitReconciliation({
        collectorId: 'user-collector',
        date: '2026-05-30',
        physicalCashPesewas: 4000,
      }),
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('rejects flagged variance with a short comment', async () => {
    await expect(
      reconciliationServiceMock.submitReconciliation({
        collectorId: 'user-collector',
        date: '2026-05-31',
        physicalCashPesewas: 4000,
        comment: 'short',
      }),
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('blocks duplicate submissions for the same collector and date', async () => {
    await reconciliationServiceMock.submitReconciliation({
      collectorId: 'user-collector',
      date: '2026-05-29',
      physicalCashPesewas: 11000,
    });

    await expect(
      reconciliationServiceMock.submitReconciliation({
        collectorId: 'user-collector',
        date: '2026-05-29',
        physicalCashPesewas: 11000,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
