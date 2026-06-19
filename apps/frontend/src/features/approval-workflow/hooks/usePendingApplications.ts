'use client';

import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '@/services';

export const pendingApplicationsQueryKey = ['borrowers', 'pending'] as const;

export function usePendingApplications() {
  return useQuery({
    queryKey: pendingApplicationsQueryKey,
    queryFn: () => borrowerService.listPendingApplications(),
  });
}
