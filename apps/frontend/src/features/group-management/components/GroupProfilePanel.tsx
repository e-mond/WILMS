'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ActivityFeed,
  DataTable,
  GroupRiskBadge,
  KpiCard,
} from '@/components/data-display';
import { Alert } from '@/components/feedback/Alert';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { ProfileSection } from '@/components/layout/executive/ProfileSection';
import { CurrencyAmount } from '@/components/data-display';
import { useGroup } from '@/features/group-management/hooks/useGroup';
import {
  GroupCollectorSection,
  GroupInformationSection,
  GroupLeaderSection,
} from '@/features/group-management/components/profile/GroupDetailSections';
import { GroupDisplayNameSection } from '@/features/group-management/components/profile/GroupDisplayNameSection';
import { GroupFormationStatusSection } from '@/features/group-management/components/profile/GroupFormationStatusSection';
import { GroupMembersSection } from '@/features/group-management/components/profile/GroupMembersSection';
import { GroupMembershipManagement } from '@/features/group-management/components/profile/GroupMembershipManagement';
import { GroupProfileActions } from '@/features/group-management/components/profile/GroupProfileActions';
import { GroupProfileAsidePanel } from '@/features/group-management/components/profile/GroupProfileAsidePanel';
import { useShellAsideContent } from '@/hooks/useShellAsideContent';
import { GROUP_RISK_DISPLAY } from '@/constants/group-risk-display';
import { GROUP_RISK_LEVEL, type GroupRiskHistoryEntry } from '@/types/group';

export interface GroupProfilePanelProps {
  groupId: string;
}

function formatRiskTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-GH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function GroupProfilePanel({ groupId }: GroupProfilePanelProps) {
  const { data, isLoading, isError, refetch } = useGroup(groupId);

  const asideContent = useMemo(
    () => (data ? <GroupProfileAsidePanel group={data} /> : null),
    [data],
  );

  useShellAsideContent(asideContent);

  if (isLoading) {
    return <LoadingSpinner label="Loading group profile" className="py-wilms-8" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Group not found"
        description="This group may have been removed or the link is invalid."
        action={
          <Link href="/groups" className="text-small font-semibold text-brand-primary hover:underline">
            Back to groups
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-wilms-4" data-print-profile="group">
      <div className="flex flex-wrap items-start justify-between gap-wilms-3">
        <div>
          <div className="flex flex-wrap items-center gap-wilms-3">
            <h1 className="text-heading-1 font-semibold text-text-primary">{data.displayName}</h1>
            <GroupRiskBadge riskLevel={data.riskLevel} />
          </div>
          <p className="mt-wilms-1 text-small text-text-muted">
            {data.groupSystemId} · {data.community} · {data.statusLabel}
          </p>
        </div>
        <GroupProfileActions group={data} onUpdated={() => void refetch()} />
      </div>

      <ExecutiveKpiGrid>
        <KpiCard variant="executive" label="Collection rate" value={`${data.collectionRatePercent}%`} />
        <KpiCard
          variant="executive"
          label="Outstanding"
          value={<CurrencyAmount value={data.outstandingPesewas} />}
        />
        <KpiCard variant="executive" label="Active loans" value={data.activeLoanCount} />
        <KpiCard variant="executive" label="Members" value={`${data.activeMemberCount}/${data.memberCount}`} />
      </ExecutiveKpiGrid>

      {data.riskLevel === GROUP_RISK_LEVEL.FLAGGED ||
      data.riskLevel === GROUP_RISK_LEVEL.SUSPENDED ? (
        <Alert title="Group requires review" variant="warning">
          {data.name} is {GROUP_RISK_DISPLAY[data.riskLevel].label.toLowerCase()}. Review member
          defaults and collection performance before approving new disbursements.
        </Alert>
      ) : null}

      <GroupInformationSection group={data} />
      <GroupDisplayNameSection group={data} onUpdated={() => void refetch()} />
      <GroupFormationStatusSection group={data} />
      <GroupLeaderSection group={data} />
      <GroupCollectorSection group={data} />
      <GroupMembersSection members={data.members} />
      <GroupMembershipManagement group={data} onUpdated={() => void refetch()} />

      <ProfileSection title="Risk History">
        {data.riskHistory.length === 0 ? (
          <p className="text-body text-text-muted">No risk level changes recorded yet.</p>
        ) : (
          <DataTable<GroupRiskHistoryEntry>
            variant="executive"
            caption="Group risk history"
            data={data.riskHistory}
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'recordedAt',
                header: 'Recorded',
                cell: (row) => formatRiskTimestamp(row.recordedAt),
              },
              {
                id: 'risk',
                header: 'Risk level',
                cell: (row) => <GroupRiskBadge riskLevel={row.riskLevel} />,
              },
              { id: 'reason', header: 'Reason', cell: (row) => row.reason },
            ]}
          />
        )}
      </ProfileSection>

      <ProfileSection title="Recent Group Activity">
        <ActivityFeed items={data.recentActivity} />
      </ProfileSection>
    </div>
  );
}
