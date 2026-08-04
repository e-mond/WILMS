'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collectorDashboardQueryKey } from '@/features/payment-collection/hooks/useCollectorDashboard';
import { reconciliationQueryKey } from '@/features/reconciliation/hooks/useReconciliation';
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
    onSuccess: async (summary) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reconciliationListQueryKey }),
        queryClient.invalidateQueries({
          queryKey: collectorDashboardQueryKey(summary.collectorId, summary.date),
        }),
        queryClient.invalidateQueries({ queryKey: ['collector', 'dashboard'] }),
        queryClient.invalidateQueries({
          queryKey: reconciliationQueryKey(summary.collectorId, summary.date),
        }),
      ]);
    },
  });
}
