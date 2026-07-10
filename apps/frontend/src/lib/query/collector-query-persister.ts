import type { Query } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const COLLECTOR_QUERY_CACHE_KEY = 'wilms-collector-query-cache';

export function shouldPersistCollectorQuery(query: Query): boolean {
  const rootKey = query.queryKey[0];
  return rootKey === 'collector';
}

export function createCollectorQueryPersister() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return createSyncStoragePersister({
    key: COLLECTOR_QUERY_CACHE_KEY,
    storage: window.localStorage,
  });
}
