'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ActivityFeed,
  CurrencyAmount,
  GroupRiskBadge,
  MemberAvatarStack,
} from '@/components/data-display';
import { DetailSidebarCard } from '@/components/layout/executive';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { GROUP_RISK_DISPLAY } from '@/constants/group-risk-display';
import { GROUP_RISK_LEVEL, type GroupListResponse, type GroupSummary } from '@/types/group';
import { buildGroupMemberLabels } from '@/utils/group-member-labels';
import { resolveGroupDisplayId } from '@/utils/entity-display-id';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import { groupsQueryKey } from '@/features/group-management/hooks/useGroups';

export interface GroupsAsidePanelProps {
  data: GroupListResponse;
  selected: GroupSummary | null;
}

export function GroupsAsidePanel({ data, selected }: GroupsAsidePanelProps) {
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const outstandingPesewas = selected
    ? Math.max(selected.disbursedPesewas - selected.collectedPesewas, 0)
    : 0;

  async function handleFlagGroup() {
    if (!selected || !flagReason.trim() || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      await groupService.flagGroup({
        groupId: selected.id,
        reason: flagReason.trim(),
        actorUserId: user.id,
      });
      toast.success('Group flagged', { message: 'Audit record created for this action.' });
      setFlagModalOpen(false);
      setFlagReason('');
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey });
    } catch {
      toast.error('Unable to flag group', { message: 'Try again shortly.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {selected ? (
        <DetailSidebarCard
          eyebrow={resolveGroupDisplayId(selected)}
          title={selected.name}
          subtitle={selected.community}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setFlagModalOpen(true)}>
                Flag Group
              </Button>
              <Link
                href={`/groups/${selected.id}`}
                className="inline-flex h-8 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-3 text-small font-semibold text-card hover:opacity-90"
              >
                View Full Profile
              </Link>
            </>
          }
        >
          <div className="mt-wilms-3">
            <GroupRiskBadge riskLevel={selected.riskLevel} />
          </div>
          <div className="mt-wilms-4">
            <p className="text-small text-text-muted">Active members</p>
            <MemberAvatarStack
              members={buildGroupMemberLabels(selected, 9)}
              totalCount={selected.activeMemberCount}
              className="mt-wilms-2"
            />
          </div>
          <dl className="mt-wilms-4 grid grid-cols-2 gap-wilms-3 text-small">
            <div>
              <dt className="text-text-muted">Disbursed</dt>
              <dd className="font-semibold">
                <CurrencyAmount value={selected.disbursedPesewas} />
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Collected</dt>
              <dd className="font-semibold">
                <CurrencyAmount value={selected.collectedPesewas} className="text-status-active" />
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Outstanding</dt>
              <dd className="font-semibold">
                <CurrencyAmount value={outstandingPesewas} />
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Collection rate</dt>
              <dd className="font-semibold">{selected.collectionRatePercent}%</dd>
            </div>
          </dl>
        </DetailSidebarCard>
      ) : null}

      <DetailSidebarCard title="Risk Distribution">
        <ul className="mt-wilms-3 space-y-wilms-2 text-small">
          {Object.entries(data.riskDistribution).map(([key, count]) => {
            const level =
              key === 'lowRisk'
                ? GROUP_RISK_LEVEL.LOW_RISK
                : key === 'atRisk'
                  ? GROUP_RISK_LEVEL.AT_RISK
                  : key === 'flagged'
                    ? GROUP_RISK_LEVEL.FLAGGED
                    : GROUP_RISK_LEVEL.SUSPENDED;

            return (
              <li key={key} className="flex items-center justify-between">
                <Link
                  href={`/groups?risk=${level}`}
                  className="flex min-w-0 flex-1 items-center gap-wilms-2 hover:text-brand-primary"
                >
                  <span className={`h-2 w-6 rounded-sm ${GROUP_RISK_DISPLAY[level].barClass}`} />
                  {GROUP_RISK_DISPLAY[level].label}
                </Link>
                <span className="font-semibold">{count}</span>
              </li>
            );
          })}
        </ul>
      </DetailSidebarCard>

      <DetailSidebarCard title="Recent Group Activity">
        <ActivityFeed items={data.recentActivity} className="mt-wilms-3" />
      </DetailSidebarCard>

      {selected ? (
        <Modal
          isOpen={flagModalOpen}
          onClose={() => setFlagModalOpen(false)}
          title="Flag Group"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setFlagModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!flagReason.trim() || isSubmitting}
                onClick={() => void handleFlagGroup()}
              >
                {isSubmitting ? 'Flagging…' : 'Confirm Flag'}
              </Button>
            </>
          }
        >
          <p className="text-body text-text-muted">
            Flagging {selected.name} creates an audit record and preserves historical data.
          </p>
          <Textarea
            aria-label="Reason for flagging group"
            className="mt-wilms-3"
            placeholder="Enter reason..."
            value={flagReason}
            onChange={(event) => setFlagReason(event.target.value)}
          />
        </Modal>
      ) : null}
    </>
  );
}
