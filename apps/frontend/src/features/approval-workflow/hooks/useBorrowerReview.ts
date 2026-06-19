'use client';

import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '@/services';

export function borrowerReviewQueryKey(borrowerId: string) {
  return ['borrowers', 'review', borrowerId] as const;
}

export function useBorrowerReview(borrowerId: string) {
  return useQuery({
    queryKey: borrowerReviewQueryKey(borrowerId),
    queryFn: () => borrowerService.getBorrowerReview(borrowerId),
  });
}
