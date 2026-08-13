'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ShellNavItem } from '@/constants/navigation';
import { BORROWER_STATUS } from '@/types/borrower';
import { borrowerService } from '@/services';
import { borrowersQueryKey } from '@/features/borrower-management/hooks/useBorrowers';

/**
 * Attaches live nav badges that share the Borrowers page source of truth.
 * Badge = active (APPROVED + AT_RISK) borrower count for `/borrowers`.
 */
export function useNavItemsWithBadges(items: ShellNavItem[]): ShellNavItem[] {
  const hasBorrowersNav = items.some((item) => item.href === '/borrowers');

  const { data } = useQuery({
    queryKey: borrowersQueryKey,
    queryFn: () => borrowerService.listBorrowers(),
    enabled: hasBorrowersNav,
    staleTime: 30_000,
  });

  const activeCount = useMemo(() => {
    if (!data) {
      return undefined;
    }
    return data.filter(
      (borrower) =>
        borrower.status === BORROWER_STATUS.APPROVED ||
        borrower.status === BORROWER_STATUS.AT_RISK,
    ).length;
  }, [data]);

  return useMemo(() => {
    if (activeCount === undefined) {
      return items;
    }
    return items.map((item) =>
      item.href === '/borrowers' ? { ...item, badge: activeCount } : item,
    );
  }, [activeCount, items]);
}
