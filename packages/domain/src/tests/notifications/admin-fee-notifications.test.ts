import { beforeEach, describe, expect, it, vi } from 'vitest';

const tryAcquire = vi.fn();
const markStatus = vi.fn();
const smsSend = vi.fn();
const mailSend = vi.fn();
const createInApp = vi.fn();
const appendAudit = vi.fn();

vi.mock('../../infrastructure/notifications/notification-dedupe.js', () => ({
  tryAcquireNotificationDelivery: (...args: unknown[]) => tryAcquire(...args),
  markNotificationDeliveryStatus: (...args: unknown[]) => markStatus(...args),
}));

vi.mock('../../infrastructure/sms/index.js', () => ({
  getSmsProvider: () => ({
    isConfigured: () => true,
    name: 'mock-sms',
    send: smsSend,
  }),
}));

vi.mock('../../infrastructure/mail/index.js', () => ({
  getMailProvider: () => ({
    send: mailSend,
  }),
}));

vi.mock('../../infrastructure/notifications/in-app-notify.js', () => ({
  createInAppNotification: (...args: unknown[]) => createInApp(...args),
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: (...args: unknown[]) => appendAudit(...args),
}));

vi.mock('../../infrastructure/notifications/delivery-log.js', () => ({
  logMessageDelivery: vi.fn(),
}));

vi.mock('../../modules/settings/service.js', () => ({
  getSettings: async () => ({
    smsNotificationsEnabled: true,
    emailNotificationsEnabled: true,
  }),
}));

vi.mock('../../infrastructure/notifications/payment-notifications.js', () => ({
  resolveCollectorUserIdForBorrower: async () => 'collector-1',
}));

vi.mock('../../infrastructure/sms/normalize-phone.js', () => ({
  normalizeGhanaPhone: (value: string) => value,
}));

describe('notifyAdminFeeRecorded', () => {
  beforeEach(() => {
    tryAcquire.mockReset();
    markStatus.mockReset();
    smsSend.mockReset();
    mailSend.mockReset();
    createInApp.mockReset();
    appendAudit.mockReset();
    tryAcquire.mockResolvedValue(true);
    smsSend.mockResolvedValue({ id: 'sms-1', provider: 'mock' });
    mailSend.mockResolvedValue({ id: 'mail-1' });
    createInApp.mockResolvedValue(undefined);
  });

  it('sends SMS once and suppresses duplicates via dedupe', async () => {
    const { notifyAdminFeeRecorded } = await import(
      '../../infrastructure/notifications/admin-fee-notifications.js'
    );

    const input = {
      transactionId: 'txn-admin-1',
      borrowerId: 'borrower-1',
      borrowerName: 'Ama Mensah',
      borrowerPhone: '+233200000001',
      amountPesewas: 5000,
      paymentDate: '2026-08-04T10:00:00.000Z',
      loanDisplayId: 'LN-2026-0042',
      actorUserId: 'collector-1',
    };

    const first = await notifyAdminFeeRecorded(input);
    expect(first.smsSent).toBe(true);
    expect(smsSend).toHaveBeenCalledTimes(1);
    expect(smsSend.mock.calls[0][0].body).toContain('GHS 50.00');
    expect(smsSend.mock.calls[0][0].body).toContain('prepared for disbursement');
    expect(appendAudit).toHaveBeenCalled();

    tryAcquire.mockResolvedValueOnce(false);
    const second = await notifyAdminFeeRecorded(input);
    expect(second.smsSent).toBe(false);
    expect(smsSend).toHaveBeenCalledTimes(1);
  });
});
