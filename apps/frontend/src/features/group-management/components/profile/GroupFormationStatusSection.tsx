'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert } from '@/components/feedback/Alert';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ProfileFieldGrid, ProfileSection } from '@/components/layout/executive/ProfileSection';
import { groupFormationService } from '@/services';
import type { GroupDetail } from '@/types/group-detail';

export interface GroupFormationStatusSectionProps {
  group: GroupDetail;
}

function formationStatusQueryKey(community: string) {
  return ['group-formation', 'community-status', community] as const;
}

export function GroupFormationStatusSection({ group }: GroupFormationStatusSectionProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: formationStatusQueryKey(group.community),
    queryFn: () => groupFormationService.getCommunityStatus(group.community),
  });

  return (
    <ProfileSection title="Community Formation Queue">
      <p className="text-body text-text-muted">
        Approved borrowers waiting for automatic group assignment in {group.community}.
      </p>
      {isLoading ? (
        <LoadingSpinner label="Loading formation status" className="py-wilms-4" />
      ) : null}
      {isError || !data ? (
        <Alert title="Formation status unavailable" variant="warning" className="mt-wilms-3">
          Community formation data could not be loaded.
        </Alert>
      ) : (
        <ProfileFieldGrid
          columns={3}
          items={[
            { label: 'Approved in queue', value: data.approvedCount },
            { label: 'Minimum group size', value: data.minGroupSize },
            { label: 'Maximum group size', value: data.maxGroupSize },
            {
              label: 'Ready for formation',
              value: data.readyForFormation ? 'Yes' : 'No',
            },
            {
              label: 'Members until next group',
              value: data.readyForFormation
                ? 'Threshold met'
                : `${Math.max(0, data.minGroupSize - data.approvedCount)} remaining`,
            },
          ]}
        />
      )}
    </ProfileSection>
  );
}
