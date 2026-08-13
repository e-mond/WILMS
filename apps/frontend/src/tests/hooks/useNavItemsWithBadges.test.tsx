import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNavItemsWithBadges } from '@/hooks/useNavItemsWithBadges';
import { TestQueryProvider } from '@/tests/utils/test-query-client';
import type { ReactNode } from 'react';

vi.mock('@/services', () => ({
  borrowerService: {
    listBorrowers: vi.fn(async () => [
      { id: '1', status: 'APPROVED', fullName: 'A', phone: '1', groupName: 'G' },
      { id: '2', status: 'AT_RISK', fullName: 'B', phone: '2', groupName: 'G' },
      { id: '3', status: 'PENDING', fullName: 'C', phone: '3', groupName: '' },
    ]),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <TestQueryProvider>{children}</TestQueryProvider>;
}

describe('useNavItemsWithBadges', () => {
  it('attaches active borrower count to Borrowers nav item', async () => {
    const { result, rerender } = renderHook(
      () =>
        useNavItemsWithBadges([
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/borrowers', label: 'Borrowers' },
        ]),
      { wrapper },
    );

    await vi.waitFor(() => {
      rerender();
      const borrowers = result.current.find((item) => item.href === '/borrowers');
      expect(borrowers?.badge).toBe(2);
    });
  });
});
