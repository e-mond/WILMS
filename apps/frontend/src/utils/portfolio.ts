import { LOAN_STATUS } from '@/types/loan';
import type { LoanPortfolioEntry, LoanPortfolioSummary } from '@/types/loan';

export interface LoanPortfolioFilters {
  searchQuery: string;
  statusFilter: string;
  cycleBatchFilter: string;
}

export function filterPortfolioEntries(
  entries: LoanPortfolioEntry[],
  filters: LoanPortfolioFilters,
): LoanPortfolioEntry[] {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  return entries.filter((entry) => {
    const matchesStatus = !filters.statusFilter || entry.status === filters.statusFilter;
    const matchesCycle =
      !filters.cycleBatchFilter || entry.cycleBatch === filters.cycleBatchFilter;
    const matchesSearch =
      !normalizedQuery ||
      entry.borrowerName.toLowerCase().includes(normalizedQuery) ||
      entry.community.toLowerCase().includes(normalizedQuery) ||
      entry.groupName.toLowerCase().includes(normalizedQuery) ||
      entry.id.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesCycle && matchesSearch;
  });
}

export function summarizePortfolioEntries(entries: LoanPortfolioEntry[]): LoanPortfolioSummary {
  return entries.reduce<LoanPortfolioSummary>(
    (summary, entry) => ({
      totalLoans: summary.totalLoans + 1,
      activeLoans:
        summary.activeLoans + (entry.status === LOAN_STATUS.ACTIVE ? 1 : 0),
      totalDisbursedPesewas: summary.totalDisbursedPesewas + entry.amountPesewas,
      totalOutstandingPesewas: summary.totalOutstandingPesewas + entry.outstandingPesewas,
    }),
    {
      totalLoans: 0,
      activeLoans: 0,
      totalDisbursedPesewas: 0,
      totalOutstandingPesewas: 0,
    },
  );
}
