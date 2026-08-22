import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services';

export function useMissedPaymentReport() {
  return useQuery({
    queryKey: ['reports', 'missed-payments'] as const,
    queryFn: () => reportService.getMissedPaymentReport(),
  });
}
