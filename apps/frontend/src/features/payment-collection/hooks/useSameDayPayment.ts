import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services';

export function sameDayPaymentQueryKey(
  borrowerId: string,
  collectorId: string,
  referenceDate?: string,
) {
  return ['payments', 'same-day', borrowerId, collectorId, referenceDate ?? 'today'] as const;
}

export function useSameDayPayment(
  borrowerId: string | undefined,
  collectorId: string | undefined,
  referenceDate?: string,
) {
  return useQuery({
    queryKey:
      borrowerId && collectorId
        ? sameDayPaymentQueryKey(borrowerId, collectorId, referenceDate)
        : ['payments', 'same-day'],
    queryFn: () => paymentService.getSameDayPayment(borrowerId!, collectorId!, referenceDate),
    enabled: Boolean(borrowerId && collectorId),
  });
}
