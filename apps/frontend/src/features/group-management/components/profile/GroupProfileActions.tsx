'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupService } from '@/services';
import type { GroupDetail } from '@/types/group-detail';
import {
  buildGroupProfileExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';

export interface GroupProfileActionsProps {
  group: GroupDetail;
  onUpdated: () => void;
}

export function GroupProfileActions({ group, onUpdated }: GroupProfileActionsProps) {
  const toast = useToast();
  const { user } = useAuth();
  const generatedBy = useWilmsExportActor();
  const exportDocument = useMemo(
    () => buildGroupProfileExportDocument(group, generatedBy),
    [group, generatedBy],
  );
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFlagGroup() {
    if (!flagReason.trim() || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      await groupService.flagGroup({
        groupId: group.id,
        reason: flagReason.trim(),
        actorUserId: user.id,
      });
      toast.success('Group flagged', { message: 'Audit record created for this action.' });
      setFlagModalOpen(false);
      setFlagReason('');
      onUpdated();
    } catch {
      toast.error('Unable to flag group', { message: 'Try again shortly.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-wilms-2 print:hidden">
        <WilmsExportActions
          document={exportDocument}
          filenameBase={`${group.id}-profile`}
          permissions={[PERMISSION.EXPORT_REPORTS, PERMISSION.MANAGE_GROUPS]}
        />
        <PermissionGate permission={PERMISSION.MANAGE_GROUPS}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setFlagModalOpen(true)}>
            Flag Group
          </Button>
        </PermissionGate>
        <Link
          href={`/reports/audit-log?entity=${group.id}`}
          className="inline-flex h-8 items-center rounded-sm border border-border px-wilms-3 text-small font-semibold text-text-primary hover:bg-background"
        >
          View Audit History
        </Link>
        <Link
          href={`/reports/group-risk?groupId=${group.id}`}
          className="inline-flex h-8 items-center rounded-sm border border-border px-wilms-3 text-small font-semibold text-text-primary hover:bg-background"
        >
          Group Risk Analysis
        </Link>
      </div>

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
              Confirm Flag
            </Button>
          </>
        }
      >
        <p className="text-body text-text-muted">
          Flagging {group.name} creates an audit record and preserves historical data.
        </p>
        <Textarea
          aria-label="Reason for flagging group"
          className="mt-wilms-3"
          placeholder="Enter reason..."
          value={flagReason}
          onChange={(event) => setFlagReason(event.target.value)}
        />
      </Modal>
    </>
  );
}
