'use client';

import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '@/services';

export function myRegistrationsQueryKey(officerId: string) {
  return ['borrowers', 'my-registrations', officerId] as const;
}

export function useMyRegistrations(officerId: string | undefined) {
  return useQuery({
    queryKey: officerId ? myRegistrationsQueryKey(officerId) : ['borrowers', 'my-registrations'],
    queryFn: () => borrowerService.listMyRegistrations(officerId!),
    enabled: Boolean(officerId),
  });
}
