'use client';

import { useQuery } from '@tanstack/react-query';
import { collectionMetricsService } from '@/services';
import type { CollectionMetricsQuery } from '@/types/collection-metrics';

export function useCollectionMetrics(query: CollectionMetricsQuery) {
  return useQuery({
    queryKey: ['collection-metrics', query],
    queryFn: () => collectionMetricsService.getMetrics(query),
  });
}
