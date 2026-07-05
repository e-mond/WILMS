import type { BorrowerSummary } from '@/types/borrower';
import { matchesAnySearchField } from '@/utils/search-match';
import { resolveBorrowerDisplayId } from '@/utils/format-borrower-display-id';

export interface BorrowerListFilters {
  searchQuery: string;
  statusFilter: string;
}

export function filterBorrowerSummaries(
  borrowers: BorrowerSummary[],
  filters: BorrowerListFilters,
): BorrowerSummary[] {
  return borrowers.filter((borrower) => {
    const matchesStatus = !filters.statusFilter || borrower.status === filters.statusFilter;
    const matchesSearch = matchesAnySearchField(filters.searchQuery, [
      borrower.fullName,
      borrower.phone,
      borrower.groupName,
      borrower.id,
      borrower.displayId,
      resolveBorrowerDisplayId(borrower),
    ]);

    return matchesStatus && matchesSearch;
  });
}
