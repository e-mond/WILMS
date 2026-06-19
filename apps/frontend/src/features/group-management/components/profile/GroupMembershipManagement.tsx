'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ProfileSection } from '@/components/layout/executive/ProfileSection';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/feedback/Alert';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { useCollectorsManagement } from '@/features/collector-management/hooks/useCollectorsManagement';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { groupService } from '@/services';
import { GROUP_MEMBER_ROLE } from '@/types/group';
import type { GroupDetail } from '@/types/group-detail';
import { ApiError } from '@/types/api';
import { canManageGroupLeader } from '@/utils/group-leader-permissions';

export interface GroupMembershipManagementProps {
  group: GroupDetail;
  onUpdated: () => void;
}

type ActiveModal =
  | 'add'
  | 'remove'
  | 'transfer'
  | 'replaceLeader'
  | 'reassignCollector'
  | 'adjustment'
  | null;

export function GroupMembershipManagement({ group, onUpdated }: GroupMembershipManagementProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [selectedCollectorId, setSelectedCollectorId] = useState(group.collector.id);

  const { data: collectorsData } = useCollectorsManagement();
  const collectors = useMemo(() => collectorsData?.collectors ?? [], [collectorsData]);
  const nonLeaderMembers = useMemo(
    () => group.members.filter((member) => member.role !== GROUP_MEMBER_ROLE.LEADER),
    [group.members],
  );
  const removableMembers = useMemo(
    () => group.members.filter((member) => member.role !== GROUP_MEMBER_ROLE.LEADER),
    [group.members],
  );
  const hasExistingLeader = useMemo(
    () => group.members.some((member) => member.role === GROUP_MEMBER_ROLE.LEADER),
    [group.members],
  );
  const canManageLeader = canManageGroupLeader(user?.role, hasExistingLeader);

  function resetForm() {
    setFullName('');
    setPhone('');
    setReason('');
    setSelectedBorrowerId('');
    setTargetGroupId('');
    setSelectedCollectorId(group.collector.id);
    setValidationMessage(null);
    setRequiresApproval(false);
  }

  function closeModal() {
    setActiveModal(null);
    resetForm();
  }

  async function validateRemoval(borrowerId: string) {
    if (!user || !borrowerId) {
      setValidationMessage(null);
      setRequiresApproval(false);
      return;
    }

    const result = await groupService.validateMembershipRemoval({
      groupId: group.id,
      borrowerId,
      reason: reason.trim() || 'Validation check',
      actorUserId: user.id,
    });

    setValidationMessage(result.message);
    setRequiresApproval(result.requiresApproval);
  }

  async function runAction(action: () => Promise<unknown>, successTitle: string) {
    if (!user || !reason.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await action();
      toast.success(successTitle, { message: 'Audit record created for this action.' });
      closeModal();
      onUpdated();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Try again shortly.';
      toast.error('Unable to complete action', { message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ProfileSection title="Membership Management">
        <p className="mb-wilms-4 text-body text-text-muted">
          Membership changes are audited. Members with active loans cannot be removed or transferred
          without Super Admin approval.
        </p>
        <PermissionGate permission={PERMISSION.MANAGE_GROUPS}>
          <div className="flex flex-wrap gap-wilms-2 print:hidden">
          <Button type="button" variant="secondary" size="sm" onClick={() => setActiveModal('add')}>
            Add Member
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setActiveModal('remove')}>
            Remove Member
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setActiveModal('transfer')}>
            Transfer Member
          </Button>
          {canManageLeader ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setActiveModal('replaceLeader')}
            >
              {hasExistingLeader ? 'Replace Group Leader' : 'Assign Group Leader'}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setActiveModal('reassignCollector')}
          >
            Reassign Collector
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setActiveModal('adjustment')}
          >
            Record Adjustment
          </Button>
          </div>
        </PermissionGate>
      </ProfileSection>

      <Modal
        isOpen={activeModal === 'add'}
        onClose={closeModal}
        title="Add Member"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!fullName.trim() || !phone.trim() || !reason.trim() || isSubmitting || !user}
              onClick={() =>
                void runAction(
                  () =>
                    groupService.addMember({
                      groupId: group.id,
                      fullName: fullName.trim(),
                      phone: phone.trim(),
                      reason: reason.trim(),
                      actorUserId: user!.id,
                    }),
                  'Member added',
                )
              }
            >
              Add Member
            </Button>
          </>
        }
      >
        <div className="space-y-wilms-3">
          <Input
            aria-label="Member full name"
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Input
            aria-label="Member phone number"
            placeholder="Phone number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Textarea
            aria-label="Reason for adding member"
            placeholder="Reason for membership change..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </Modal>

      <MemberActionModal
        isOpen={activeModal === 'remove'}
        title="Remove Member"
        confirmLabel="Remove Member"
        confirmVariant="danger"
        group={group}
        members={removableMembers}
        selectedBorrowerId={selectedBorrowerId}
        onSelectBorrower={(borrowerId) => {
          setSelectedBorrowerId(borrowerId);
          void validateRemoval(borrowerId);
        }}
        reason={reason}
        onReasonChange={setReason}
        validationMessage={validationMessage}
        requiresApproval={requiresApproval}
        isSubmitting={isSubmitting}
        canSubmit={Boolean(selectedBorrowerId && reason.trim() && user && !requiresApproval)}
        onClose={closeModal}
        onConfirm={() =>
          void runAction(
            () =>
              groupService.removeMember({
                groupId: group.id,
                borrowerId: selectedBorrowerId,
                reason: reason.trim(),
                actorUserId: user!.id,
              }),
            'Member removed',
          )
        }
      />

      <MemberActionModal
        isOpen={activeModal === 'transfer'}
        title="Transfer Member"
        confirmLabel="Transfer Member"
        group={group}
        members={removableMembers}
        selectedBorrowerId={selectedBorrowerId}
        onSelectBorrower={(borrowerId) => {
          setSelectedBorrowerId(borrowerId);
          void validateRemoval(borrowerId);
        }}
        reason={reason}
        onReasonChange={setReason}
        validationMessage={validationMessage}
        requiresApproval={requiresApproval}
        isSubmitting={isSubmitting}
        canSubmit={Boolean(
          selectedBorrowerId && targetGroupId.trim() && reason.trim() && user && !requiresApproval,
        )}
        onClose={closeModal}
        onConfirm={() =>
          void runAction(
            () =>
              groupService.transferMember({
                groupId: group.id,
                borrowerId: selectedBorrowerId,
                targetGroupId: targetGroupId.trim(),
                reason: reason.trim(),
                actorUserId: user!.id,
              }),
            'Member transferred',
          )
        }
      >
        <Input
          aria-label="Target group ID"
          className="mt-wilms-3"
          placeholder="Target group ID (e.g. GRP-0029)"
          value={targetGroupId}
          onChange={(event) => setTargetGroupId(event.target.value)}
        />
      </MemberActionModal>

      <MemberActionModal
        isOpen={activeModal === 'replaceLeader'}
        title="Replace Group Leader"
        confirmLabel="Replace Leader"
        group={group}
        members={nonLeaderMembers}
        selectedBorrowerId={selectedBorrowerId}
        onSelectBorrower={setSelectedBorrowerId}
        reason={reason}
        onReasonChange={setReason}
        isSubmitting={isSubmitting}
        canSubmit={Boolean(selectedBorrowerId && reason.trim() && user)}
        onClose={closeModal}
        onConfirm={() =>
          void runAction(
            () =>
              groupService.replaceLeader({
                groupId: group.id,
                borrowerId: selectedBorrowerId,
                reason: reason.trim(),
                actorUserId: user!.id,
              }),
            'Group leader replaced',
          )
        }
      />

      <Modal
        isOpen={activeModal === 'reassignCollector'}
        onClose={closeModal}
        title="Reassign Collector"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedCollectorId || !reason.trim() || isSubmitting || !user}
              onClick={() =>
                void runAction(
                  () =>
                    groupService.reassignCollector({
                      groupId: group.id,
                      collectorId: selectedCollectorId,
                      reason: reason.trim(),
                      actorUserId: user!.id,
                    }),
                  'Collector reassigned',
                )
              }
            >
              Reassign Collector
            </Button>
          </>
        }
      >
        <Select
          aria-label="Select collector"
          value={selectedCollectorId}
          onChange={(event) => setSelectedCollectorId(event.target.value)}
        >
          {collectors.map((collector) => (
            <option key={collector.id} value={collector.id}>
              {collector.displayName} · {collector.zone}
            </option>
          ))}
        </Select>
        <Textarea
          aria-label="Reason for reassigning collector"
          className="mt-wilms-3"
          placeholder="Reason for reassignment..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Modal>

      <Modal
        isOpen={activeModal === 'adjustment'}
        onClose={closeModal}
        title="Record Group Adjustment"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!reason.trim() || isSubmitting || !user}
              onClick={() =>
                void runAction(
                  () =>
                    groupService.recordAdjustment({
                      groupId: group.id,
                      reason: reason.trim(),
                      actorUserId: user!.id,
                    }),
                  'Adjustment recorded',
                )
              }
            >
              Record Adjustment
            </Button>
          </>
        }
      >
        <p className="text-body text-text-muted">
          Record a membership correction or administrative adjustment for {group.name}. Historical
          records are preserved.
        </p>
        <Textarea
          aria-label="Adjustment reason"
          className="mt-wilms-3"
          placeholder="Describe the adjustment..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Modal>
    </>
  );
}

interface MemberActionModalProps {
  isOpen: boolean;
  title: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  group: GroupDetail;
  members: GroupDetail['members'];
  selectedBorrowerId: string;
  onSelectBorrower: (borrowerId: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  validationMessage?: string | null;
  requiresApproval?: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}

function MemberActionModal({
  isOpen,
  title,
  confirmLabel,
  confirmVariant = 'primary',
  group,
  members,
  selectedBorrowerId,
  onSelectBorrower,
  reason,
  onReasonChange,
  validationMessage,
  requiresApproval = false,
  isSubmitting,
  canSubmit,
  onClose,
  onConfirm,
  children,
}: MemberActionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            disabled={!canSubmit || isSubmitting}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body text-text-muted">
        Select a member from {group.name}. Group leaders must be replaced using the dedicated action.
      </p>
      <Select
        aria-label="Select member"
        className="mt-wilms-3"
        value={selectedBorrowerId}
        onChange={(event) => onSelectBorrower(event.target.value)}
      >
        <option value="">Select member...</option>
        {members.map((member) => (
          <option key={member.borrowerId} value={member.borrowerId}>
            {member.fullName} · {member.borrowerId} · {member.loanStatus}
          </option>
        ))}
      </Select>
      {children}
      {validationMessage ? (
        <Alert
          className="mt-wilms-3"
          title={requiresApproval ? 'Approval required' : 'Validation'}
          variant={requiresApproval ? 'warning' : 'info'}
        >
          {validationMessage}
        </Alert>
      ) : null}
      <Textarea
        aria-label="Reason for membership change"
        className="mt-wilms-3"
        placeholder="Reason for this change..."
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
    </Modal>
  );
}
