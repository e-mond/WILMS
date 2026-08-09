import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
  requireDatabase: vi.fn(),
  getDb: () => ({}),
}));

vi.mock('../../infrastructure/notifications/in-app-notify.js', () => ({
  createInAppNotification: vi.fn(async () => undefined),
}));

describe('holiday request lifecycle and SoD', () => {
  beforeEach(async () => {
    const { __resetHolidayRequestMemoryForTests } = await import(
      '../../modules/holiday-requests/service.js'
    );
    __resetHolidayRequestMemoryForTests();
  });

  it('creates drafts and submits them', async () => {
    const service = await import('../../modules/holiday-requests/service.js');
    const draft = await service.createHolidayRequest({
      name: 'Eid',
      holidayDate: '2026-03-20',
      requestedByUserId: 'collector-1',
    });
    expect(draft.status).toBe('DRAFT');

    const submitted = await service.submitHolidayRequest(draft.id, 'collector-1');
    expect(submitted.status).toBe('SUBMITTED');
  });

  it('blocks the requester from approving their own request', async () => {
    const service = await import('../../modules/holiday-requests/service.js');
    const request = await service.createHolidayRequest({
      name: 'Founders Day',
      holidayDate: '2026-07-04',
      requestedByUserId: 'collector-1',
      submit: true,
    });

    await expect(service.approveHolidayRequest(request.id, 'collector-1')).rejects.toThrow(
      /cannot approve a holiday request you created/i,
    );
  });

  it('approves with SoD and applies an organisation holiday', async () => {
    const service = await import('../../modules/holiday-requests/service.js');
    const request = await service.createHolidayRequest({
      name: 'Republic Day',
      holidayDate: '2026-07-01',
      requestedByUserId: 'collector-1',
      submit: true,
    });

    const applied = await service.approveHolidayRequest(request.id, 'approver-1', 'OK');
    expect(applied.status).toBe('APPLIED');
    expect(applied.organizationHolidayId).toBeTruthy();
    expect(applied.reviewedByUserId).toBe('approver-1');

    const holidays = await import('../../modules/organization-holidays/service.js');
    const listed = await holidays.listHolidays();
    expect(listed.some((entry) => entry.name === 'Republic Day')).toBe(true);
  });

  it('rejects with SoD and does not apply', async () => {
    const service = await import('../../modules/holiday-requests/service.js');
    const request = await service.createHolidayRequest({
      name: 'Local festival',
      holidayDate: '2026-08-15',
      requestedByUserId: 'collector-1',
      submit: true,
    });

    const rejected = await service.rejectHolidayRequest(request.id, 'approver-1', 'Overlap');
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.reviewNote).toBe('Overlap');
  });
});
