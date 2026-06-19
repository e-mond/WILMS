'use client';

import { useQuery } from '@tanstack/react-query';
import { expenseService } from '@/services';

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.listExpenses(),
  });
}
