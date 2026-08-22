import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetNotificationDedupeForTests } from '../../infrastructure/notifications/notification-dedupe.js';
import { resetNotificationMetricsForTests } from '../../infrastructure/notifications/notification-metrics.js';

const sendMock = vi.fn(async () => ({ id: 'sms-1', provider: 'test-sms' }));

vi.mock('../../modules/settings/service.js', () => ({
  getSettings: vi.fn(async () => ({
    smsNotificationsEnabled: true,
  })),
}));

vi.mock('../../infrastructure/sms/index.js', () => ({
  getSmsProvider: vi.fn(() => ({
    name: 'test-sms',
    isConfigured: () => true,
    send: sendMock,
  })),
}));

vi.mock('../../infrastructure/notifications/delivery-log.js', () => ({
  logMessageDelivery: vi.fn(async () => undefined),
}));

describe('notifyGuarantorMissedPayments dedupe', () => {
  beforeEach(async () => {
    resetNotificationDedupeForTests();
    resetNotificationMetricsForTests();
    sendMock.mockClear();
    vi.resetModules();
  });

  it('sends only once per borrower while missed condition persists', async () => {
    const { notifyGuarantorMissedPayments } = await import(
      '../../infrastructure/notifications/event-dispatch.js'
    );

    const input = {
      guarantorName: 'Kofi',
      guarantorPhone: '0240000002',
      borrowerId: 'borrower-99',
      borrowerName: 'Ama',
    };

    await notifyGuarantorMissedPayments(input);
    await notifyGuarantorMissedPayments(input);

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('uses guarantor-missed dedupe key in source', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
    const source = readFileSync(
      join(root, 'src/infrastructure/notifications/event-dispatch.ts'),
      'utf8',
    );
    const block = source.slice(
      source.indexOf('export async function notifyGuarantorMissedPayments'),
      source.indexOf('// ─── Loan notifications'),
    );

    expect(block).toContain('tryAcquireNotificationDelivery');
    expect(block).toContain('guarantor-missed:${input.borrowerId}');
    expect(block).toContain('markNotificationDeliveryStatus');
  });
});
