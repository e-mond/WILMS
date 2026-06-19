import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services';
import type { GlobalSearchParams } from '@/types/search';

export const globalSearchQueryKey = (params: GlobalSearchParams) =>
  ['global-search', params.role, params.query, params.limit] as const;

export function useGlobalSearch(params: GlobalSearchParams, enabled = true) {
  const trimmedQuery = params.query.trim();

  return useQuery({
    queryKey: globalSearchQueryKey(params),
    queryFn: () => searchService.globalSearch(params),
    enabled: enabled && trimmedQuery.length >= 2,
    staleTime: 30_000,
  });
}
