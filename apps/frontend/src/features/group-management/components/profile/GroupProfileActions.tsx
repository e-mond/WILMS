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
  buildBrandedExportFilenameBase,
  buildGroupProfileExportDocument,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';
import { resolveGroupDisplayId } from '@/utils/entity-display-id';

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
  const [dissolveModalOpen, setDissolveModalOpen] = useState(false);
  const [dissolveReason, setDissolveReason] = useState('');
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

  async function handleDissolveGroup() {
    if (!dissolveReason.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await groupService.dissolveGroup({
        groupId: group.id,
        reason: dissolveReason.trim(),
      });
      toast.success('Group dissolved', {
        message: 'Members were removed and the group was marked dissolved.',
      });
      setDissolveModalOpen(false);
      setDissolveReason('');
      onUpdated();
    } catch (error) {
      toast.error('Unable to dissolve group', {
        message: error instanceof Error ? error.message : 'Try again shortly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-wilms-2 print:hidden">
        <WilmsExportActions
          document={exportDocument}
          filenameBase={buildBrandedExportFilenameBase([
            'Group_Profile',
            group.displayName ?? group.name,
            resolveGroupDisplayId(group),
          ])}
          permissions={[PERMISSION.EXPORT_REPORTS, PERMISSION.MANAGE_GROUPS]}
        />
        <PermissionGate permission={PERMISSION.MANAGE_GROUPS}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setFlagModalOpen(true)}>
            Flag Group
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => setDissolveModalOpen(true)}>
            Dissolve Group
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

      <Modal
        isOpen={dissolveModalOpen}
        onClose={() => setDissolveModalOpen(false)}
        title="Dissolve Group"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDissolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!dissolveReason.trim() || isSubmitting}
              onClick={() => void handleDissolveGroup()}
            >
              Confirm dissolve
            </Button>
          </>
        }
      >
        <p className="text-body text-text-muted">
          Dissolving {group.name} removes active membership and marks the group as dissolved. Groups
          with outstanding obligations may be rejected unless settled first.
        </p>
        <Textarea
          aria-label="Reason for dissolving group"
          className="mt-wilms-3"
          placeholder="Enter reason..."
          value={dissolveReason}
          onChange={(event) => setDissolveReason(event.target.value)}
        />
      </Modal>
    </>
  );
}
