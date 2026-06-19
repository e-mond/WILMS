import { useQuery } from '@tanstack/react-query';
import type { FinancialLedgerReportParams } from '@/types/reports';
import { reportService } from '@/services';

export function financialLedgerReportQueryKey(params: FinancialLedgerReportParams) {
  return ['reports', 'financial-ledger', params.fromDate ?? '', params.toDate ?? ''] as const;
}

export function useFinancialLedgerReport(params: FinancialLedgerReportParams) {
  return useQuery({
    queryKey: financialLedgerReportQueryKey(params),
    queryFn: () => reportService.getFinancialLedgerReport(params),
  });
}
