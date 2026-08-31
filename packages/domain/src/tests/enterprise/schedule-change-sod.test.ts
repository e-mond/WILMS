import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
  getDb: () => ({}),
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  findLoanById: vi.fn(async (id: string) => ({
    id,
    borrowerId: 'borrower-1',
    paymentDay: 'Tuesday',
    installmentAmount: '100',
  })),
}));

vi.mock('../../repositories/loan-schedule.repository.js', () => ({
  listScheduleWeeks: vi.fn(async () => []),
  updateScheduleWeekDueDate: vi.fn(async () => undefined),
}));

vi.mock('../../db/persistence.js', () => ({
  getBorrower: vi.fn(async () => null),
  saveBorrower: vi.fn(async () => undefined),
  assignBorrowerToGroup: vi.fn(async () => undefined),
}));

vi.mock('../../modules/organization-holidays/service.js', () => ({
  listHolidays: vi.fn(async () => []),
}));

vi.mock('../../infrastructure/notifications/ops-notifications.js', () => ({
  emitScheduleChangedNotification: vi.fn(async () => undefined),
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: vi.fn(),
}));

describe('schedule change maker-checker', () => {
  beforeEach(async () => {
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
});
