import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';
import type { LoanPortfolioReportParams } from '@/types/reports';

export function loanPortfolioReportQueryKey(params: LoanPortfolioReportParams) {
  return [
    'reports',
    'loan-portfolio',
    params.search ?? '',
    params.status ?? '',
    params.cycleBatch ?? '',
  ] as const;
}

export function useLoanPortfolioReport(params: LoanPortfolioReportParams) {
  return useQuery({
    queryKey: loanPortfolioReportQueryKey(params),
    queryFn: () => reportService.getLoanPortfolioReport(params),
  });
}
