import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createInAppNotification,
  emitScheduleChangedNotification,
  resolveCollectorUserIdForBorrower,
  listUsers,
} = vi.hoisted(() => ({
  createInAppNotification: vi.fn(async () => undefined),
  emitScheduleChangedNotification: vi.fn(async () => undefined),
  resolveCollectorUserIdForBorrower: vi.fn(async () => 'collector-1'),
  listUsers: vi.fn(async () => [
    {
      id: 'approver-1',
      role: 'APPROVER',
      status: 'ACTIVE',
      email: 'a@test',
      displayName: 'Approver',
    },
    {
      id: 'admin-1',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      email: 's@test',
      displayName: 'Admin',
    },
  ]),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
  getDb: () => ({}),
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  findLoanById: vi.fn(async (id: string) => ({
    id,
    borrowerId: 'borrower-1',
    paymentDay: 'Tuesday',
    externalStatus: 'ACTIVE',
    installmentAmount: '100',
  })),
}));

vi.mock('../../repositories/loan-schedule.repository.js', () => ({
  listScheduleWeeks: vi.fn(async () => [
    { weekNumber: 3, dueDate: '2026-08-20', status: 'PENDING' },
    { weekNumber: 4, dueDate: '2026-08-27', status: 'PENDING' },
  ]),
  updateScheduleWeekDueDate: vi.fn(async () => undefined),
}));

vi.mock('../../repositories/user.repository.js', () => ({
  listUsers,
  getUserById: vi.fn(async () => null),
}));

vi.mock('../../db/persistence.js', () => ({
  getBorrower: vi.fn(async () => ({
    id: 'borrower-1',
    fullName: 'Test Borrower',
    phone: '+233200000000',
    profile: { email: 'borrower@test' },
  })),
  saveBorrower: vi.fn(async () => undefined),
  assignBorrowerToGroup: vi.fn(async () => undefined),
}));

vi.mock('../../modules/organization-holidays/service.js', () => ({
  listHolidays: vi.fn(async () => []),
}));

vi.mock('../../infrastructure/notifications/ops-notifications.js', () => ({
  emitScheduleChangedNotification,
}));

vi.mock('../../infrastructure/notifications/in-app-notify.js', () => ({
  createInAppNotification,
}));

vi.mock('../../infrastructure/notifications/payment-notifications.js', () => ({
  resolveCollectorUserIdForBorrower,
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: vi.fn(),
}));

describe('schedule change maker-checker', () => {
  beforeEach(async () => {
    createInAppNotification.mockClear();
    emitScheduleChangedNotification.mockClear();
    const service = await import('../../modules/enterprise/service.js');
    service.__resetEnterpriseWorkflowMemoryForTests();
  });

  it('blocks the requester from reviewing their own payment day change', async () => {
    const service = await import('../../modules/enterprise/service.js');
    const request = await service.requestScheduleChange({
      loanId: 'loan-1',
      toPaymentDay: 'Friday',
      effectiveFrom: '2026-08-10',
      reason: 'Collector route alignment',
      actorUserId: 'user-requester',
    });

    await expect(
      service.reviewScheduleChange({
        changeId: request.id,
        actorUserId: 'user-requester',
      }),
    ).rejects.toThrow(/cannot review a payment day change you requested/i);
  });

  it('blocks the requester from approving their own payment day change', async () => {
    const service = await import('../../modules/enterprise/service.js');
    const request = await service.requestScheduleChange({
      loanId: 'loan-2',
      toPaymentDay: 'Monday',
      effectiveFrom: '2026-08-10',
      reason: 'Market day conflict',
      actorUserId: 'user-requester',
    });

    await expect(
      service.approveScheduleChange({
        changeId: request.id,
        actorUserId: 'user-requester',
      }),
    ).rejects.toThrow(/cannot approve a payment day change you requested/i);
  });

  it('requires review before approval', async () => {
    const service = await import('../../modules/enterprise/service.js');
    const request = await service.requestScheduleChange({
      loanId: 'loan-3',
      toPaymentDay: 'Wednesday',
      effectiveFrom: '2026-08-10',
      reason: 'Route change',
      actorUserId: 'user-requester',
    });

    await expect(
      service.approveScheduleChange({
        changeId: request.id,
        actorUserId: 'admin-1',
      }),
    ).rejects.toThrow(/must be reviewed before approval/i);
  });

  it('blocks the reviewer from approving the same payment day change', async () => {
    const service = await import('../../modules/enterprise/service.js');
    const request = await service.requestScheduleChange({
      loanId: 'loan-4',
      toPaymentDay: 'Thursday',
      effectiveFrom: '2026-08-10',
      reason: 'Route change',
      actorUserId: 'user-requester',
    });

    await service.reviewScheduleChange({
      changeId: request.id,
      actorUserId: 'approver-1',
    });

    await expect(
      service.approveScheduleChange({
        changeId: request.id,
        actorUserId: 'approver-1',
      }),
    ).rejects.toThrow(/cannot approve a payment day change you reviewed/i);
  });

  it('rejects duplicate pending requests for the same loan', async () => {
    const service = await import('../../modules/enterprise/service.js');
    await service.requestScheduleChange({
      loanId: 'loan-5',
      toPaymentDay: 'Friday',
      effectiveFrom: '2026-08-10',
      reason: 'First request',
      actorUserId: 'user-requester',
    });

    await expect(
      service.requestScheduleChange({
        loanId: 'loan-5',
        toPaymentDay: 'Monday',
        effectiveFrom: '2026-08-17',
        reason: 'Second request',
        actorUserId: 'user-requester',
      }),
    ).rejects.toThrow(/already has a pending payment day change/i);
  });

  it('notifies borrower and collector on approval after review', async () => {
    const service = await import('../../modules/enterprise/service.js');
    const request = await service.requestScheduleChange({
      loanId: 'loan-6',
      toPaymentDay: 'Friday',
      effectiveFrom: '2026-08-10',
      reason: 'Route change',
      actorUserId: 'user-requester',
    });

    await service.reviewScheduleChange({
      changeId: request.id,
      actorUserId: 'approver-1',
    });

    const result = await service.approveScheduleChange({
      changeId: request.id,
      actorUserId: 'admin-1',
    });

    expect(result.status).toBe('APPROVED');
    expect(emitScheduleChangedNotification).toHaveBeenCalled();
    expect(createInAppNotification).toHaveBeenCalled();
  });

  it('notifies the requester when a change is rejected', async () => {
    const service = await import('../../modules/enterprise/service.js');
    const request = await service.requestScheduleChange({
      loanId: 'loan-7',
      toPaymentDay: 'Saturday',
      effectiveFrom: '2026-08-10',
      reason: 'Route change',
      actorUserId: 'user-requester',
    });

    const result = await service.rejectScheduleChange({
      changeId: request.id,
      actorUserId: 'approver-1',
      note: 'Insufficient reason',
    });

    expect(result.status).toBe('REJECTED');
    expect(createInAppNotification).toHaveBeenCalled();
  });
});
