import { useQuery } from '@tanstack/react-query';
import { overpaymentReviewService } from '@/services';

export function overpaymentReviewsQueryKey() {
  return ['overpayment-reviews', 'pending'] as const;
}

export function useOverpaymentReviews() {
  return useQuery({
    queryKey: overpaymentReviewsQueryKey(),
    queryFn: () => overpaymentReviewService.listPendingReviews(),
  });
}
