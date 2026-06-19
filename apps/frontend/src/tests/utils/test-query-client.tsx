import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function TestQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createTestQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
