'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';
import {
  createCollectorQueryPersister,
  shouldPersistCollectorQuery,
} from '@/lib/query/collector-query-persister';
import { createQueryClient } from '@/lib/query/query-client';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());
  const [persister] = useState(() => createCollectorQueryPersister());

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => shouldPersistCollectorQuery(query),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
