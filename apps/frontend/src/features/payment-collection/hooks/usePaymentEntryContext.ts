import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services';

export function paymentEntryContextQueryKey(borrowerId: string, referenceDate?: string) {
  return ['borrowers', borrowerId, 'payment-entry', referenceDate ?? 'today'] as const;
}

export function usePaymentEntryContext(borrowerId: string, referenceDate?: string) {
  return useQuery({
    queryKey: paymentEntryContextQueryKey(borrowerId, referenceDate),
    queryFn: () => paymentService.getPaymentEntryContext(borrowerId, referenceDate),
    enabled: Boolean(borrowerId),
  });
}
