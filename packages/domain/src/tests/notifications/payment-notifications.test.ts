import { describe, expect, it, beforeEach } from 'vitest';
import {
  resetNotificationDedupeForTests,
  tryAcquireNotificationDelivery,
} from '../../infrastructure/notifications/notification-dedupe.js';
import { resetNotificationMetricsForTests } from '../../infrastructure/notifications/notification-metrics.js';
import { DEDUPE } from '../../infrastructure/notifications/payment-notifications.js';
import { buildLoanReminderSmsBody, buildMissedPaymentSmsBody } from '../../infrastructure/notifications/templates.js';

describe('notification dedupe', () => {
  beforeEach(() => {
    resetNotificationDedupeForTests();
    resetNotificationMetricsForTests();
  });

  it('allows first delivery and blocks duplicate for same dedupe key', async () => {
    const first = await tryAcquireNotificationDelivery({
      dedupeKey: 'payment-confirmed:pay-1',
      recipient: '+233200000001',
      channel: 'SMS',
      notificationType: 'PAYMENT_CONFIRMED',
    });
    const second = await tryAcquireNotificationDelivery({
      dedupeKey: 'payment-confirmed:pay-1',
      recipient: '+233200000001',
      channel: 'SMS',
      notificationType: 'PAYMENT_CONFIRMED',
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('allows same dedupe key for different channels', async () => {
    const dedupeKey = DEDUPE.paymentDueSoon('loan-1', '2026-05-15');
    const sms = await tryAcquireNotificationDelivery({
      dedupeKey,
      recipient: '+233200000001',
      channel: 'SMS',
      notificationType: 'PAYMENT_DUE_SOON',
    });
    const email = await tryAcquireNotificationDelivery({
      dedupeKey,
      recipient: 'borrower@example.com',
      channel: 'EMAIL',
      notificationType: 'PAYMENT_DUE_SOON',
    });

    expect(sms).toBe(true);
    expect(email).toBe(true);
  });

  it('prevents duplicate under concurrent acquisition attempts', async () => {
    const dedupeKey = DEDUPE.paymentMissed('loan-9', '2026-05-10');
    const attempts = await Promise.all(
      Array.from({ length: 20 }, () =>
        tryAcquireNotificationDelivery({
          dedupeKey,
          recipient: 'collector-user-1',
          channel: 'IN_APP',
          notificationType: 'PAYMENT_MISSED',
        }),
      ),
    );

    expect(attempts.filter(Boolean).length).toBe(1);
  });
});

describe('payment notification templates', () => {
  it('builds due-soon reminder with tomorrow wording', () => {
    const body = buildLoanReminderSmsBody({
      borrowerName: 'Ama',
      loanDisplayId: 'LOAN-ABC',
      amountPesewas: 5000,
      dueDate: '2026-05-16',
      dueTomorrow: true,
    });
    expect(body).toContain('due tomorrow');
    expect(body).toContain('GHS 50.00');
  });

  it('builds professional missed-payment message with due date', () => {
    const body = buildMissedPaymentSmsBody({
      borrowerName: 'Ama',
      amountPesewas: 5000,
      dueDate: '2026-05-10',
    });
    expect(body).toContain('was not recorded');
    expect(body).toContain('2026-05-10');
    expect(body).not.toContain('threat');
  });
});

describe('dedupe key helpers', () => {
  it('uses stable payment event keys', () => {
    expect(DEDUPE.paymentConfirmed('pay-123')).toBe('payment-confirmed:pay-123');
    expect(DEDUPE.paymentDueSoon('loan-1', '2026-05-15')).toBe(
      'payment-due-soon:loan-1:2026-05-15',
    );
    expect(DEDUPE.paymentMissed('loan-1', '2026-05-15')).toBe(
      'payment-missed:loan-1:2026-05-15',
    );
  });
});
