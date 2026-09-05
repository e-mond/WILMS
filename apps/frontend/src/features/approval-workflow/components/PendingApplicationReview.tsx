'use client';



import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Alert } from '@/components/feedback/Alert';

import { EmptyState } from '@/components/feedback/EmptyState';

import { QueryErrorState } from '@/components/feedback/QueryErrorState';

import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';

import { Select } from '@/components/ui/Select';

import { ApprovalDecisionModal } from '@/features/approval-workflow/components/ApprovalDecisionModal';

import { BorrowerReviewProfile } from '@/features/approval-workflow/components/BorrowerReviewProfile';

import { useApprovalActions } from '@/features/approval-workflow/hooks/useApprovalActions';

import { useBorrowerReview } from '@/features/approval-workflow/hooks/useBorrowerReview';

import {
  buildBrandedExportFilenameBase,
  REGISTRATION_AGREEMENT_EXPORT_FORMATS,
  useWilmsExportActor,
  WilmsExportActions,
} from '@/features/export';
import { useRegistrationAgreementExportDocument } from '@/features/export/hooks/useRegistrationAgreementExportDocument';

import { borrowerService, collectorManagementService, groupService } from '@/services';

import { BORROWER_STATUS } from '@/types/borrower';

import type { ApprovalDecisionAction } from '@/types/approval';

import { ApiError, API_ERROR_CODE } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/features/settings/hooks/useSettings';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';



export interface PendingApplicationReviewProps {

  borrowerId: string;

}



export function PendingApplicationReview({ borrowerId }: PendingApplicationReviewProps) {

  const router = useRouter();
  const queryClient = useQueryClient();
  const generatedBy = useWilmsExportActor();
  const { user } = useAuth();
  const { data: settings } = useSettings();

  const { data, isLoading, isError, error, refetch } = useBorrowerReview(borrowerId);

  const { approveMutation, rejectMutation, blacklistMutation, escalateMutation, isSubmitting } =

    useApprovalActions(borrowerId);

  const [activeAction, setActiveAction] = useState<ApprovalDecisionAction | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPaymentDay, setNewGroupPaymentDay] = useState('Tuesday');
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);



  const groupsQuery = useQuery({
    queryKey: ['groups', 'list', 'approver-review'],
    queryFn: () => groupService.listGroups(),
    retry: 1,
    throwOnError: false,
  });

  const collectorsQuery = useQuery({
    queryKey: ['collectors', 'list', 'approver-review'],
    queryFn: () => collectorManagementService.listCollectors(),
    retry: 1,
    throwOnError: false,
  });

  const guarantorEligibilityQuery = useQuery({
    queryKey: ['guarantor-eligibility', borrowerId, data?.guarantorPhone],
    queryFn: () =>
      borrowerService.checkGuarantorEligibility({
        guarantorPhone: data!.guarantorPhone,
        guarantorName: data!.guarantorName,
      }),
    enabled: Boolean(data?.guarantorPhone && data?.guarantorName),
  });

  const createGroupMutation = useMutation({
    mutationFn: () => {
      if (!selectedCollectorId) {
        throw new ApiError(
          'Select a collector before creating a group.',
          API_ERROR_CODE.VALIDATION,
          422,
        );
      }
      return groupService.createGroup({
        name: newGroupName.trim(),
        community: data?.community ?? 'General',
        collectorUserId: selectedCollectorId,
        paymentDay: newGroupPaymentDay,
        memberBorrowerIds: [borrowerId],
      });
    },
    onSuccess: (group) => {
      setSelectedGroupId(group.id);
      setNewGroupName('');
      setActionError(null);
      setWorkflowMessage(`Created group "${group.name}" and added ${data?.fullName ?? 'borrower'}.`);
      void queryClient.invalidateQueries({ queryKey: ['groups', 'list', 'approver-review'] });
      void queryClient.invalidateQueries({ queryKey: ['borrowers', borrowerId, 'review'] });
      void refetch();
    },
    onError: (error) => {
      setActionError(
        error instanceof ApiError
          ? error.message
          : 'Unable to create a group for this borrower.',
      );
    },
  });

  const assignGroupMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) {
        throw new ApiError('You must be signed in to assign a group.', API_ERROR_CODE.UNAUTHORIZED, 401);
      }
      if (!data) {
        throw new ApiError('Borrower details are still loading.', API_ERROR_CODE.VALIDATION, 422);
      }
      if (!selectedGroupId) {
        throw new ApiError('Select a group before assigning.', API_ERROR_CODE.VALIDATION, 422);
      }
      return groupService.addMember({
        groupId: selectedGroupId,
        borrowerId,
        fullName: data.fullName,
        phone: data.phone,
        reason: 'Approver review assignment',
        actorUserId: user.id,
      });
    },
    onSuccess: (group) => {
      const label = group.groupSystemId
        ? `${group.groupSystemId} — ${group.displayName || group.name}`
        : group.displayName || group.name;
      setActionError(null);
      setWorkflowMessage(`Assigned ${data?.fullName ?? 'borrower'} to ${label}.`);
      notifyMutationSuccess('Group assigned', `${data?.fullName ?? 'Borrower'} is now in ${label}.`);
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
      void queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['collector-dashboard'] });
      void refetch();
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "We couldn't assign the borrower to the selected group. Please try again.";
      setActionError(message);
      notifyMutationError('Group assignment failed', error, message);
      console.error('[approver] assign group failed', error);
    },
  });

  const groups = useMemo(() => groupsQuery.data?.groups ?? [], [groupsQuery.data]);

  const collectors = useMemo(
    () => collectorsQuery.data?.collectors ?? [],
    [collectorsQuery.data],
  );

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedGroupIsFull = Boolean(selectedGroup?.isFull);



  const exportDocument = useRegistrationAgreementExportDocument(
    data,
    data?.registeredByOfficerName ?? generatedBy,
  );



  const redirectAfterDecision = async () => {

    const pendingApplications = await borrowerService.listPendingApplications();

    const nextApplication = pendingApplications.find((application) => application.id !== borrowerId);



    router.push(

      nextApplication ? `/approver/pending/${nextApplication.id}` : '/approver/pending',

    );

  };



  const handleConfirm = async (reason?: string) => {

    setActionError(null);



    try {

      if (activeAction === 'approve') {

        await approveMutation.mutateAsync();

      } else if (activeAction === 'reject' && reason) {

        await rejectMutation.mutateAsync({ reason });

      } else if (activeAction === 'blacklist' && reason) {

        await blacklistMutation.mutateAsync({ reason });

      } else if (activeAction === 'escalate' && reason) {

        await escalateMutation.mutateAsync({ reason });

      }



      setActiveAction(null);

      if (activeAction !== 'escalate') {
        await redirectAfterDecision();
      } else {
        await refetch();
      }

    } catch (error) {

      setActionError(

        error instanceof ApiError

          ? error.message

          : 'Unable to complete this approval action. Please try again.',

      );

    }

  };



  if (isLoading) {

    return <InlinePanelSkeleton />;

  }



  if (isError) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => void refetch()}
        title="Application not found"
        description="This borrower application could not be loaded."
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Application not found"
        description="This borrower application could not be loaded."
        action={
          <Button type="button" variant="secondary" onClick={() => router.push('/approver/pending')}>
            Back to queue
          </Button>
        }
      />
    );
  }



  const isPending = data.status === BORROWER_STATUS.PENDING;

  const guarantorEligibility = guarantorEligibilityQuery.data
    ? {
        activeGuaranteeCount: guarantorEligibilityQuery.data.activeGuaranteeCount,
        maxGuarantees: guarantorEligibilityQuery.data.maxGuarantees,
        validationStatus: guarantorEligibilityQuery.data.validationStatus,
      }
    : null;



  return (

    <div className="space-y-wilms-6">

      <div className="flex flex-wrap items-center justify-between gap-wilms-3">

        <Link href="/approver/pending" className="text-small font-semibold text-brand-primary hover:underline">

          Back to pending queue

        </Link>

        {exportDocument ? (

          <WilmsExportActions
            document={exportDocument}
            filenameBase={buildBrandedExportFilenameBase([
              'Borrower_Registration_Review',
              data?.fullName,
              data?.displayId,
            ])}
            showIcons
            permissions={[]}
            formats={[...REGISTRATION_AGREEMENT_EXPORT_FORMATS]}
          />

        ) : null}

      </div>



      {actionError ? (

        <Alert title="Action failed" variant="error">

          {actionError}

        </Alert>

      ) : null}



      {workflowMessage ? (

        <Alert title="Workflow updated" variant="info">

          {workflowMessage}

        </Alert>

      ) : null}



      <BorrowerReviewProfile borrower={data} guarantorEligibility={guarantorEligibility} />

      {groupsQuery.isError || collectorsQuery.isError ? (
        <Alert title="Assignment lists unavailable" variant="warning">
          {groupsQuery.isError && collectorsQuery.isError
            ? 'Groups and collectors could not be loaded. You can still review this application.'
            : groupsQuery.isError
              ? 'Groups could not be loaded. Collector assignment remains available.'
              : 'Collectors could not be loaded. Group assignment remains available.'}
        </Alert>
      ) : null}

      {isPending ? (

        <div className="space-y-wilms-4 border-t border-border pt-wilms-6">

          <div className="grid gap-wilms-4 md:grid-cols-2">

            <label className="block space-y-wilms-2">

              <span className="text-small font-semibold text-text-primary">Assign group</span>

              <Select

                value={selectedGroupId}

                onChange={(event) => setSelectedGroupId(event.target.value)}

              >

                <option value="">Select group</option>

                {groups.map((group) => {

                  const max = group.maxGroupSize ?? settings?.maxGroupSize ?? 10;
                  const full = group.isFull ?? group.memberCount >= max;
                  const label = `${group.displayName || group.name} · ${group.memberCount}/${max}${full ? ' (full)' : ''}`;

                  return (

                  <option key={group.id} value={group.id} disabled={full}>

                    {label}

                  </option>

                  );

                })}

              </Select>

              <p className="text-caption text-text-secondary">
                Choose a group, then click Assign Group. The borrower is linked by borrower ID.
              </p>

              {selectedGroupIsFull ? (
                <Alert title="Group is full" variant="warning">
                  {selectedGroup?.displayName || selectedGroup?.name} has {selectedGroup?.memberCount} of {selectedGroup?.maxGroupSize ?? settings?.maxGroupSize} members. Create a new group below or choose another group.
                </Alert>
              ) : null}

              <div className="space-y-wilms-2">
                  <Input
                    aria-label="New group name"
                    placeholder={data?.community ? `${data.community} Group` : 'Enter a group name'}
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                  />
                  <Select
                    aria-label="Group collection day"
                    value={newGroupPaymentDay}
                    onChange={(event) => setNewGroupPaymentDay(event.target.value)}
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </Select>
                  <p className="text-caption text-text-secondary">
                    Community is pre-filled from the application ({data?.community ?? 'unknown'}). Select a collector, then create the group.
                  </p>
                  <PermissionGate permissions={[PERMISSION.APPROVE_BORROWERS, PERMISSION.MANAGE_GROUPS]}>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        !newGroupName.trim() ||
                        !selectedCollectorId ||
                        createGroupMutation.isPending
                      }
                      onClick={() => {
                        setActionError(null);
                        if (!newGroupName.trim()) {
                          setNewGroupName(`${data?.community ?? 'Community'} Group`);
                        }
                        createGroupMutation.mutate();
                      }}
                    >
                      {createGroupMutation.isPending ? 'Creating…' : 'Create New Group'}
                    </Button>
                  </PermissionGate>
                </div>

                <PermissionGate permissions={[PERMISSION.MANAGE_GROUPS, PERMISSION.APPROVE_BORROWERS]}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={assignGroupMutation.isPending || !user?.id || selectedGroupIsFull}
                    onClick={() => {
                      setActionError(null);
                      if (!selectedGroupId) {
                        setActionError('Select a group before assigning.');
                        return;
                      }
                      assignGroupMutation.mutate();
                    }}
                  >
                    {assignGroupMutation.isPending ? 'Assigning…' : 'Assign Group'}
                  </Button>
                </PermissionGate>

            </label>



            <label className="block space-y-wilms-2">

              <span className="text-small font-semibold text-text-primary">Assign collector</span>

              <Select

                value={selectedCollectorId}

                onChange={(event) => setSelectedCollectorId(event.target.value)}

              >

                <option value="">Select collector</option>

                {collectors.map((collector) => (

                  <option key={collector.id} value={collector.id}>

                    {collector.displayName} · {collector.zone}

                  </option>

                ))}

              </Select>

              <PermissionGate permission={PERMISSION.MANAGE_GROUPS}>
              <Button

                type="button"

                variant="secondary"

                disabled={!selectedCollectorId}

                onClick={() =>

                  setWorkflowMessage(`Collector assignment recorded for ${data.fullName}.`)

                }

              >

                Assign Collector

              </Button>
              </PermissionGate>

            </label>

          </div>



          <div className="flex flex-col gap-wilms-3 sm:flex-row sm:flex-wrap">

            <PermissionGate permission={PERMISSION.APPROVE_BORROWERS}>
            <Button

              type="button"

              variant="primary"

              disabled={isSubmitting}

              onClick={() => setActiveAction('approve')}

            >

              Approve

            </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSION.REJECT_LOANS}>
            <Button

              type="button"

              variant="secondary"

              disabled={isSubmitting}

              onClick={() => setActiveAction('reject')}

            >

              Reject

            </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSION.REVIEW_APPLICATIONS}>
            <Button

              type="button"

              variant="secondary"

              disabled={isSubmitting}

              onClick={() => setWorkflowMessage(`Change request sent to registration officer for ${data.fullName}.`)}

            >

              Request Changes

            </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSION.REVIEW_RISK_FLAGS}>
            <Button

              type="button"

              variant="secondary"

              disabled={isSubmitting}

              onClick={() => setActiveAction('escalate')}

            >

              Escalate Review

            </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSION.APPROVE_BORROWERS}>
            <Button

              type="button"

              variant="danger"

              disabled={isSubmitting}

              onClick={() => setActiveAction('blacklist')}

            >

              Blacklist

            </Button>
            </PermissionGate>

          </div>

        </div>

      ) : (

        <Alert title="Application already decided" variant="info">

          This application is no longer pending and cannot be changed from this screen.

        </Alert>

      )}



      <ApprovalDecisionModal

        action={activeAction}

        isSubmitting={isSubmitting}

        onClose={() => setActiveAction(null)}

        onConfirm={handleConfirm}

      />

    </div>

  );

}

