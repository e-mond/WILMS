import { describe, expect, it } from 'vitest';
import locationServiceMock from '@/services/mock/locationService.mock';

describe('locationService mock autocomplete', () => {
  it('filters to community entity type', async () => {
    const response = await locationServiceMock.autocomplete('Acc', 12, { types: ['community'] });
    expect(response.data.every((row) => row.type === 'community')).toBe(true);
  });
});
