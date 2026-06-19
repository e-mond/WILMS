import type { LoanPortfolioEntry } from '@/types/loan';
import type { LoanPortfolioReport, LoanPortfolioReportParams } from '@/types/reports';
import { filterPortfolioEntries, summarizePortfolioEntries } from '@/utils/portfolio';

export function buildLoanPortfolioReport(
  entries: LoanPortfolioEntry[],
  params: LoanPortfolioReportParams = {},
): LoanPortfolioReport {
  const filtered = filterPortfolioEntries(entries, {
    searchQuery: params.search ?? '',
    statusFilter: params.status ?? '',
    cycleBatchFilter: params.cycleBatch ?? '',
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: summarizePortfolioEntries(filtered),
    entries: filtered,
  };
}
