import { describe, expect, it } from 'vitest';
import { shouldPersistCollectorQuery } from '@/lib/query/collector-query-persister';

describe('collector query persister', () => {
  it('persists only collector-scoped query keys', () => {
    expect(
      shouldPersistCollectorQuery({
        queryKey: ['collector', 'user-1', 'dashboard', 'today'],
      } as never),
    ).toBe(true);

    expect(
      shouldPersistCollectorQuery({
        queryKey: ['dashboard', 'summary'],
      } as never),
    ).toBe(false);
  });
});
