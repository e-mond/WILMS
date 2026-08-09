import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: () => ({
    insert: () => ({
      values: () => ({
        returning: async () => {
          const error = Object.assign(new Error('relation "holiday_requests" does not exist'), {
            code: '42P01',
          });
          throw error;
        },
      }),
    }),
  }),
}));

describe('holiday request repository error mapping', () => {
  it('maps missing holiday_requests table to SCHEMA_MISSING', async () => {
    const { insertHolidayRequest } = await import(
      '../../repositories/holiday-request.repository.js'
    );

    await expect(
      insertHolidayRequest({
        id: '11111111-1111-7111-8111-111111111111',
        name: 'Test',
        holidayDate: '2026-01-01',
        endDate: null,
        reason: null,
        notes: null,
        evidenceUrl: null,
        community: null,
        groupId: null,
        borrowerId: null,
        scope: 'NATIONAL',
        branch: null,
        status: 'DRAFT',
        requestedByUserId: '22222222-2222-7222-8222-222222222222',
        reviewedByUserId: null,
        reviewNote: null,
        reviewedAt: null,
        organizationHolidayId: null,
        appliedAt: null,
      }),
    ).rejects.toThrow(/SCHEMA_MISSING:Holiday requests are not available/i);
  });
});
