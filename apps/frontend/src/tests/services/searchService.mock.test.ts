import { describe, expect, it } from 'vitest';
import searchServiceMock from '@/services/mock/searchService.mock';
import { USER_ROLE } from '@/constants/roles';
import { GLOBAL_SEARCH_ENTITY } from '@/types/search';

describe('searchService.mock', () => {
  it('returns cross-entity results for super admin', async () => {
    const results = await searchServiceMock.globalSearch({
      query: 'Accra',
      role: USER_ROLE.SUPER_ADMIN,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.entityType === GLOBAL_SEARCH_ENTITY.GROUP)).toBe(true);
  });

  it('limits borrower search for approver to pending applications', async () => {
    const results = await searchServiceMock.globalSearch({
      query: 'a',
      role: USER_ROLE.APPROVER,
      limit: 20,
    });

    const applicationResults = results.filter(
      (result) => result.entityType === GLOBAL_SEARCH_ENTITY.APPLICATION,
    );

    expect(applicationResults.length).toBeGreaterThan(0);
    expect(applicationResults.every((result) => result.href.startsWith('/approver/pending/'))).toBe(
      true,
    );
  });

  it('returns collector payment links for field search', async () => {
    const results = await searchServiceMock.globalSearch({
      query: 'Ama',
      role: USER_ROLE.COLLECTOR,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.href.startsWith('/collector/payment/')).toBe(true);
  });
});
