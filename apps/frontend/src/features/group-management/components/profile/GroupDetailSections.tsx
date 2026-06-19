'use client';

import Link from 'next/link';
import { Avatar, CurrencyAmount, GroupRiskBadge } from '@/components/data-display';
import { ProfileFieldGrid, ProfileSection } from '@/components/layout/executive/ProfileSection';
import type { GroupDetail } from '@/types/group-detail';
import { formatDisplayDate } from '@/utils/format-date';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';

export interface GroupInformationSectionProps {
  group: GroupDetail;
}

export function GroupInformationSection({ group }: GroupInformationSectionProps) {
  return (
    <ProfileSection title="Group Information">
      <ProfileFieldGrid
        columns={4}
        items={[
          { label: 'Display Name', value: group.displayName },
          {
            label: 'System ID',
            value: (
              <span className="font-semibold text-executive-gold">{group.groupSystemId}</span>
            ),
          },
          { label: 'Group Name', value: group.name },
          { label: 'Group ID', value: <span className="font-semibold text-executive-gold">{group.id}</span> },
          { label: 'Group Status', value: group.statusLabel },
          { label: 'Creation Date', value: formatDisplayDate(group.formedAt) },
          { label: 'Community / Zone', value: group.community },
          { label: 'Assigned Collector', value: group.collector.fullName },
          { label: 'Registration Officer', value: group.registrationOfficerName },
          { label: 'Group Leader', value: group.leader.fullName },
          { label: 'Cycle', value: group.cycle.label },
          { label: 'Risk Rating', value: <GroupRiskBadge riskLevel={group.riskLevel} /> },
          { label: 'Total Members', value: group.memberCount },
          { label: 'Active Members', value: group.activeMemberCount },
          { label: 'Active Loans', value: group.activeLoanCount },
          {
            label: 'Outstanding Balance',
            value: <CurrencyAmount value={group.outstandingPesewas} />,
          },
          {
            label: 'Repayment Performance',
            value: `${group.repaymentPerformancePercent}%`,
          },
          {
            label: 'Disbursed',
            value: <CurrencyAmount value={group.disbursedPesewas} />,
          },
          {
            label: 'Collected',
            value: <CurrencyAmount value={group.collectedPesewas} className="text-status-active" />,
          },
        ]}
      />
    </ProfileSection>
  );
}

export interface GroupLeaderSectionProps {
  group: GroupDetail;
}

export function GroupLeaderSection({ group }: GroupLeaderSectionProps) {
  const leader = group.leader;

  return (
    <ProfileSection title="Group Leader Information">
      <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-start">
        <Avatar
          label={leader.fullName}
          photoUrl={resolveEntityPhotoUrl({
            name: leader.fullName,
            id: leader.borrowerId,
            photoUrl: leader.photoUrl,
          })}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <ProfileFieldGrid
            columns={3}
            items={[
              { label: 'Full Name', value: leader.fullName },
              { label: 'Phone Number', value: leader.phone },
              { label: 'Email Address', value: leader.email ?? 'Not provided' },
              { label: 'National ID', value: leader.nationalId },
              { label: 'Address', value: leader.address },
              { label: 'GPS / Location', value: leader.gpsAddress },
              { label: 'Member Since', value: formatDisplayDate(leader.memberSince) },
              { label: 'Current Status', value: leader.status },
              {
                label: 'Borrower Profile',
                value: (
                  <Link
                    href={`/borrowers/${leader.borrowerId}`}
                    className="font-semibold text-brand-primary hover:underline"
                  >
                    View full profile
                  </Link>
                ),
              },
            ]}
          />
        </div>
      </div>
    </ProfileSection>
  );
}

export interface GroupCollectorSectionProps {
  group: GroupDetail;
}

export function GroupCollectorSection({ group }: GroupCollectorSectionProps) {
  const collector = group.collector;

  return (
    <ProfileSection title="Assigned Collector Information">
      <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-start">
        <Avatar
          label={collector.fullName}
          photoUrl={resolveEntityPhotoUrl({
            name: collector.fullName,
            id: collector.id,
            photoUrl: collector.photoUrl,
          })}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <ProfileFieldGrid
            columns={3}
            items={[
              { label: 'Full Name', value: collector.fullName },
              { label: 'Collector ID', value: collector.id },
              { label: 'Phone Number', value: collector.phone },
              { label: 'Email', value: collector.email ?? 'Not provided' },
              { label: 'Assigned Zone', value: collector.zone },
              { label: 'Assigned Groups', value: collector.assignedGroupCount },
              { label: 'Collection Rate', value: `${collector.collectionRatePercent}%` },
              {
                label: 'Last Activity',
                value: new Date(collector.lastActiveAt).toLocaleString('en-GH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              },
              {
                label: 'Collector Profile',
                value: (
                  <Link
                    href={`/collectors/${collector.id}`}
                    className="font-semibold text-brand-primary hover:underline"
                  >
                    View collector profile
                  </Link>
                ),
              },
            ]}
          />
        </div>
      </div>
    </ProfileSection>
  );
}
