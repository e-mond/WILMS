'use client';

import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '@/services';
import { useAuth } from '@/hooks/useAuth';

export function reviewedApplicationsQueryKey(approverId?: string) {
  return ['borrowers', 'reviewed', approverId] as const;
}

export function useReviewedApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: reviewedApplicationsQueryKey(user?.id),
    queryFn: () => borrowerService.listReviewedApplications(user!.id),
    enabled: Boolean(user?.id),
  });
}
