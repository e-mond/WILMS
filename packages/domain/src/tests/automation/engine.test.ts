import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
  getDb: () => ({}),
}));

vi.mock('../../infrastructure/notifications/in-app-notify.js', () => ({
  createInAppNotification: vi.fn(async () => undefined),
}));

vi.mock('../../modules/notifications/push.service.js', () => ({
  sendPushToUser: vi.fn(async () => ({ sent: 0, failed: 0 })),
}));

describe('automation engine foundations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defines payment reminder and escalation ladders', async () => {
    const {
      OVERDUE_ESCALATION_DAYS,
      PAYMENT_REMINDER_OFFSETS_DAYS,
    } = await import('../../modules/automation/service.js');
    expect(PAYMENT_REMINDER_OFFSETS_DAYS).toEqual([-3, -1, 0, 1, 3, 7, 14, 30]);
    expect(OVERDUE_ESCALATION_DAYS).toEqual([7, 14, 30, 60, 90]);
  });

  it('runs a daily automation pass without database', async () => {
    const { runDailyAutomationPass, PAYMENT_REMINDER_OFFSETS_DAYS, OVERDUE_ESCALATION_DAYS } =
      await import('../../modules/automation/service.js');
    const result = await runDailyAutomationPass();
    expect(result.remindersEvaluated).toBe(PAYMENT_REMINDER_OFFSETS_DAYS.length);
    expect(result.escalationsEvaluated).toBe(OVERDUE_ESCALATION_DAYS.length);
    expect(result.followUpsCreated).toBeTypeOf('number');
    expect(result.executivePackRecipients).toBeTypeOf('number');
  });

  it('exposes escalation role ladder aligned to thresholds', async () => {
    const { ESCALATION_ROLE_LADDER, OVERDUE_ESCALATION_DAYS } = await import(
      '../../modules/automation/service.js'
    );
    expect(ESCALATION_ROLE_LADDER).toHaveLength(OVERDUE_ESCALATION_DAYS.length);
  });
});
