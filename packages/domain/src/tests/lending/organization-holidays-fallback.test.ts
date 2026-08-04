import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: () => ({
    select: () => ({
      from: () => ({
        orderBy: async () => {
          const error = new Error('relation "organization_holidays" does not exist');
          (error as { code?: string }).code = '42P01';
          throw error;
        },
      }),
    }),
  }),
}));

import { listOrganizationHolidays } from '../../repositories/organization-holiday.repository.js';

describe('organization holiday repository', () => {
  it('returns an empty list when the holidays table has not been migrated', async () => {
    await expect(listOrganizationHolidays()).resolves.toEqual([]);
  });
});
