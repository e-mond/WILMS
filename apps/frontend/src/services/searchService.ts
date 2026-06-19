import { apiClient } from '@/utils/apiClient';
import type { GlobalSearchParams, GlobalSearchResult } from '@/types/search';
import type { ISearchService } from '@/types/services';

const searchService: ISearchService = {
  globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResult[]> {
    const searchParams = new URLSearchParams({
      q: params.query,
      role: params.role,
    });

    if (params.limit !== undefined) {
      searchParams.set('limit', String(params.limit));
    }

    return apiClient.get<GlobalSearchResult[]>(`/search?${searchParams.toString()}`);
  },
};

export default searchService;
