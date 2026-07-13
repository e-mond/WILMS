'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reconciliationService } from '@/services';
import type { ReviewReconciliationInput } from '@/types/services';

export const reconciliationListQueryKey = ['reconciliations'] as const;

export function useReconciliationList(collectorId?: string) {
  return useQuery({
    queryKey: [...reconciliationListQueryKey, collectorId ?? 'all'],
    queryFn: () => reconciliationService.listReconciliations(collectorId ? { collectorId } : undefined),
    staleTime: 30_000,
  });
}

export function useReviewReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewReconciliationInput }) =>
      reconciliationService.reviewReconciliation(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reconciliationListQueryKey });
    },
  });
}
