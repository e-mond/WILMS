import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';
import type { DailyCollectionReportParams } from '@/types/reports';

export function dailyCollectionReportQueryKey(params: DailyCollectionReportParams) {
  return [
    'reports',
    'daily-collection',
    params.date,
    params.collectorId ?? '',
  ] as const;
}

export function useDailyCollectionReport(params: DailyCollectionReportParams) {
  return useQuery({
    queryKey: dailyCollectionReportQueryKey(params),
    queryFn: () => reportService.getDailyCollectionReport(params),
    enabled: Boolean(params.date),
  });
}
