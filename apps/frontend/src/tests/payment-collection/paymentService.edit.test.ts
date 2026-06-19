import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/mock/delay', () => ({
  simulateDelay: async () => undefined,
}));
import { AUDIT_ACTION } from '@/constants/audit';
import { getAuditEntries, resetAuditLog } from '@/services/mock/audit-log.store';
import { resetMockBorrowerRegistrations } from '@/services/mock/borrowerService.mock';
import { resetMockLoans } from '@/services/mock/loanService.mock';
import {
  getMockSupervisorAlerts,
  resetMockSupervisorAlerts,
} from '@/services/mock/notificationService.mock';
import paymentServiceMock, {
  resetMockPaymentTransactions,
} from '@/services/mock/paymentService.mock';
import { resetPaymentTransactions } from '@/services/mock/payment-transaction.store';
import { resetMockTransactions } from '@/services/mock/transactionService.mock';

describe('paymentService.editPayment', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    resetMockTransactions();
    resetMockLoans();
    resetPaymentTransactions();
    resetMockPaymentTransactions();
    resetAuditLog();
    resetMockSupervisorAlerts();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-23T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records audit and supervisor alert for same-day correction', async () => {
    const updated = await paymentServiceMock.editPayment('payment-001', {
      collectorId: 'user-collector',
      reason: 'Corrected GPS capture location after field retry',
      gps: {
        latitude: 5.6037,
        longitude: -0.187,
        capturedAt: '2026-05-23T12:05:00.000Z',
      },
    });

    expect(updated.editReason).toContain('Corrected GPS');
    expect(getAuditEntries().some((entry) => entry.action === AUDIT_ACTION.PAYMENT_EDITED)).toBe(
      true,
    );
    expect(getMockSupervisorAlerts()).toHaveLength(1);
  });

  it('blocks edits after the payment day ends', async () => {
    vi.setSystemTime(new Date('2026-05-24T12:00:00.000Z'));

    await expect(
      paymentServiceMock.editPayment('payment-001', {
        collectorId: 'user-collector',
        reason: 'Attempted late correction',
      }),
    ).rejects.toThrow(/locked/i);
  });
});
