import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isDatabaseEnabled: vi.fn(() => true),
  listLoans: vi.fn(),
  getBorrower: vi.fn(),
  listScheduleWeeks: vi.fn(),
  applyMissedWeekMarking: vi.fn(async () => []),
  getSettings: vi.fn(),
  emitPaymentDueSoonNotification: vi.fn(async () => true),
  emitPaymentDueTodayNotification: vi.fn(async () => true),
  emitPaymentMissedNotification: vi.fn(async () => undefined),
  emitPaymentOverdueLadderNotification: vi.fn(async () => undefined),
  emitAdminMissedPaymentSummary: vi.fn(async () => undefined),
  resolveCollectorUserIdForBorrower: vi.fn(async () => 'collector-1'),
  processOperationalNotificationJobs: vi.fn(async () => ({ reconReminders: 0 })),
  emitSchedulerFailureAlert: vi.fn(async () => undefined),
  notifyGuarantorMissedPayments: vi.fn(async () => undefined),
  recordSchedulerRun: vi.fn(),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => mocks.isDatabaseEnabled(),
  getDb: () => ({}),
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  listLoans: mocks.listLoans,
}));

vi.mock('../../repositories/borrower.repository.js', () => ({
  getBorrower: mocks.getBorrower,
}));

vi.mock('../../repositories/loan-schedule.repository.js', () => ({
  listScheduleWeeks: mocks.listScheduleWeeks,
  applyMissedWeekMarking: mocks.applyMissedWeekMarking,
}));

vi.mock('../../modules/settings/service.js', () => ({
  getSettings: mocks.getSettings,
}));

vi.mock('../../infrastructure/notifications/payment-notifications.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../infrastructure/notifications/payment-notifications.js')
  >('../../infrastructure/notifications/payment-notifications.js');
  return {
    ...actual,
    emitPaymentDueSoonNotification: mocks.emitPaymentDueSoonNotification,
    emitPaymentDueTodayNotification: mocks.emitPaymentDueTodayNotification,
    emitPaymentMissedNotification: mocks.emitPaymentMissedNotification,
    emitPaymentOverdueLadderNotification: mocks.emitPaymentOverdueLadderNotification,
    emitAdminMissedPaymentSummary: mocks.emitAdminMissedPaymentSummary,
    resolveCollectorUserIdForBorrower: mocks.resolveCollectorUserIdForBorrower,
  };
});

vi.mock('../../infrastructure/notifications/ops-notifications.js', () => ({
  processOperationalNotificationJobs: mocks.processOperationalNotificationJobs,
  emitSchedulerFailureAlert: mocks.emitSchedulerFailureAlert,
}));

vi.mock('../../infrastructure/notifications/event-dispatch.js', () => ({
  notifyGuarantorMissedPayments: mocks.notifyGuarantorMissedPayments,
}));

vi.mock('../../infrastructure/scheduler/scheduler-run-state.js', () => ({
  recordSchedulerRun: mocks.recordSchedulerRun,
}));

import { processPaymentNotificationJobs } from '../../modules/notifications/payment-scheduler.service.js';

const REFERENCE = '2026-08-17';

function activeLoan(id: string, borrowerId: string) {
  return {
    id,
    borrowerId,
    loanBalance: '500.00',
    installmentAmount: '50.00',
    cycleBatch: 'C1',
    startDate: '2026-06-01',
    externalStatus: 'ACTIVE',
  };
}

function borrower(id: string, phone = '0244123456') {
  return {
    id,
    fullName: `Borrower ${id}`,
    phone,
    groupId: 'group-1',
    profile: { email: `${id}@example.com` },
  };
}

describe('T-1 payment reminder scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDatabaseEnabled.mockReturnValue(true);
    mocks.getSettings.mockResolvedValue({
      paymentReminderDaysBefore: 1,
      latePaymentGraceDays: 3,
    });
    mocks.applyMissedWeekMarking.mockResolvedValue([]);
    mocks.processOperationalNotificationJobs.mockResolvedValue({ reconReminders: 0 });
    mocks.emitPaymentDueSoonNotification.mockResolvedValue(true);
    mocks.emitPaymentDueTodayNotification.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends a T-1 reminder when the next pending week is due tomorrow', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-18T00:00:00.000Z', weekNumber: 1 },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.listLoans).toHaveBeenCalledWith({ externalStatus: 'ACTIVE' });
    expect(mocks.emitPaymentDueSoonNotification).toHaveBeenCalledTimes(1);
    expect(mocks.emitPaymentDueSoonNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId: 'loan-1',
        dueDate: '2026-08-18',
        borrowerId: 'bor-1',
      }),
    );
    expect(mocks.emitPaymentDueTodayNotification).not.toHaveBeenCalled();
    expect(result.remindersSent).toBe(1);
  });

  it('does not send a T-1 reminder when the next week is due today', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-17', weekNumber: 1 },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).not.toHaveBeenCalled();
    expect(mocks.emitPaymentDueTodayNotification).toHaveBeenCalledTimes(1);
    expect(result.remindersSent).toBe(0);
    expect(result.dueTodaySent).toBe(1);
  });

  it('does not send a T-1 reminder when the next week is due in two days', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-19', weekNumber: 1 },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).not.toHaveBeenCalled();
    expect(result.remindersSent).toBe(0);
  });

  it('does not send a T-1 reminder when the next week was due yesterday', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-16', weekNumber: 1 },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).not.toHaveBeenCalled();
    expect(result.remindersSent).toBe(0);
  });

  it('sends a reminder to each eligible borrower due tomorrow', async () => {
    mocks.listLoans.mockResolvedValue([
      activeLoan('loan-1', 'bor-1'),
      activeLoan('loan-2', 'bor-2'),
    ]);
    mocks.getBorrower.mockImplementation(async (id: string) => borrower(id));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-18', weekNumber: 1 },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).toHaveBeenCalledTimes(2);
    expect(result.remindersSent).toBe(2);
  });

  it('uses only the next payable pending week when later weeks also exist', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PAID', dueDate: '2026-08-11', weekNumber: 1 },
      { status: 'PENDING', dueDate: '2026-08-18', weekNumber: 2 },
      { status: 'PENDING', dueDate: '2026-08-25', weekNumber: 3 },
    ]);

    await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).toHaveBeenCalledTimes(1);
    expect(mocks.emitPaymentDueSoonNotification).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: '2026-08-18' }),
    );
  });

  it('does not send a T-1 reminder for a later week when an earlier pending week is unpaid', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-11', weekNumber: 1 },
      { status: 'PENDING', dueDate: '2026-08-18', weekNumber: 2 },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).not.toHaveBeenCalled();
    expect(result.remindersSent).toBe(0);
  });

  it('does not scan inactive or closed loans', async () => {
    mocks.listLoans.mockResolvedValue([]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.listLoans).toHaveBeenCalledWith({ externalStatus: 'ACTIVE' });
    expect(mocks.emitPaymentDueSoonNotification).not.toHaveBeenCalled();
    expect(result.activeLoansScanned).toBe(0);
  });

  it('skips fully paid active loans', async () => {
    mocks.listLoans.mockResolvedValue([
      { ...activeLoan('loan-1', 'bor-1'), loanBalance: '0.00' },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.listScheduleWeeks).not.toHaveBeenCalled();
    expect(result.skippedFullyPaid).toBe(1);
    expect(mocks.emitPaymentDueSoonNotification).not.toHaveBeenCalled();
  });

  it('does not send a duplicate when the emitter reports the reminder already sent', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-18', weekNumber: 1 },
    ]);
    mocks.emitPaymentDueSoonNotification.mockResolvedValue(false);

    const first = await processPaymentNotificationJobs(REFERENCE);
    const second = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).toHaveBeenCalledTimes(2);
    expect(first.remindersSent).toBe(0);
    expect(second.remindersSent).toBe(0);
  });

  it('retries after a previous SMS failure', async () => {
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-18', weekNumber: 1 },
    ]);
    mocks.emitPaymentDueSoonNotification
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const first = await processPaymentNotificationJobs(REFERENCE);
    const second = await processPaymentNotificationJobs(REFERENCE);

    expect(first.remindersSent).toBe(0);
    expect(second.remindersSent).toBe(1);
  });

  it('falls back to a one-day lead when the configured lead time is invalid', async () => {
    mocks.getSettings.mockResolvedValue({
      paymentReminderDaysBefore: 0,
      latePaymentGraceDays: 3,
    });
    mocks.listLoans.mockResolvedValue([activeLoan('loan-1', 'bor-1')]);
    mocks.getBorrower.mockResolvedValue(borrower('bor-1'));
    mocks.listScheduleWeeks.mockResolvedValue([
      { status: 'PENDING', dueDate: '2026-08-18', weekNumber: 1 },
    ]);

    const result = await processPaymentNotificationJobs(REFERENCE);

    expect(mocks.emitPaymentDueSoonNotification).toHaveBeenCalledTimes(1);
    expect(result.remindersSent).toBe(1);
  });
});
