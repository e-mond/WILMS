import type { BorrowerSummary } from '@/types/borrower';

export interface BorrowerListFilters {
  searchQuery: string;
  statusFilter: string;
}

export function filterBorrowerSummaries(
  borrowers: BorrowerSummary[],
  filters: BorrowerListFilters,
): BorrowerSummary[] {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  return borrowers.filter((borrower) => {
    const matchesStatus = !filters.statusFilter || borrower.status === filters.statusFilter;
    const matchesSearch =
      !normalizedQuery ||
      borrower.fullName.toLowerCase().includes(normalizedQuery) ||
      borrower.phone.toLowerCase().includes(normalizedQuery) ||
      borrower.groupName.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesSearch;
  });
}
