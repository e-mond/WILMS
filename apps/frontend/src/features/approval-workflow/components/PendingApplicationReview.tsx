'use client';



import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Alert } from '@/components/feedback/Alert';

import { EmptyState } from '@/components/feedback/EmptyState';

import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';

import { Select } from '@/components/ui/Select';

import { ApprovalDecisionModal } from '@/features/approval-workflow/components/ApprovalDecisionModal';

import { BorrowerReviewProfile } from '@/features/approval-workflow/components/BorrowerReviewProfile';

import { useApprovalActions } from '@/features/approval-workflow/hooks/useApprovalActions';

import { useBorrowerReview } from '@/features/approval-workflow/hooks/useBorrowerReview';

import {

  buildTabularExportDocument,

  useWilmsExportActor,

  WilmsExportActions,
  WILMS_REPORT_TYPE,
} from '@/features/export';

import { borrowerService, collectorManagementService, groupService } from '@/services';

import { BORROWER_STATUS } from '@/types/borrower';

import type { ApprovalDecisionAction } from '@/types/approval';

import { ApiError } from '@/types/api';
import { formatDisplayDate } from '@/utils/format-date';



export interface PendingApplicationReviewProps {

  borrowerId: string;

}



export function PendingApplicationReview({ borrowerId }: PendingApplicationReviewProps) {

  const router = useRouter();

  const generatedBy = useWilmsExportActor();

  const { data, isLoading, isError } = useBorrowerReview(borrowerId);

  const { approveMutation, rejectMutation, blacklistMutation, isSubmitting } =

    useApprovalActions(borrowerId);

  const [activeAction, setActiveAction] = useState<ApprovalDecisionAction | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [selectedCollectorId, setSelectedCollectorId] = useState('');

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
        guarantorIdNumber: data!.guarantorPhone,
        guarantorName: data!.guarantorName,
      }),
    enabled: Boolean(data?.guarantorPhone && data?.guarantorName),
  });

  const groups = useMemo(() => (groupsQuery.data?.groups ?? []).slice(0, 8), [groupsQuery.data]);

  const collectors = useMemo(
    () => (collectorsQuery.data?.collectors ?? []).slice(0, 8),
    [collectorsQuery.data],
  );



  const exportDocument = useMemo(() => {

    if (!data) {

      return null;

    }



    return buildTabularExportDocument({
      reportType: WILMS_REPORT_TYPE.GENERIC_REPORT,
      reportTitle: `Approval Review — ${data.fullName}`,
      generatedBy,
      headers: ['Field', 'Value'],
      rows: [

        ['Applicant', data.fullName],

        ['Phone', data.phone],

        ['Community', data.community],

        ['Guarantor', data.guarantorName],

        ['Registered by', data.registeredByOfficerName],

        ['Submitted', formatDisplayDate(data.registeredAt)],

        ['Status', data.status],

      ],

    });

  }, [data, generatedBy]);



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

      }



      setActiveAction(null);

      await redirectAfterDecision();

    } catch (error) {

      setActionError(

        error instanceof ApiError

          ? error.message

          : 'Unable to complete this approval action. Please try again.',

      );

    }

  };



  if (isLoading) {

    return <LoadingSpinner label="Loading application" className="py-wilms-8" />;

  }



  if (isError || !data) {

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
            filenameBase={`approval-${borrowerId}`}
            showIcons
            permissions={[PERMISSION.EXPORT_REPORTS, PERMISSION.REVIEW_APPLICATIONS]}
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

                {groups.map((group) => (

                  <option key={group.id} value={group.id}>

                    {group.name} · {group.community}

                  </option>

                ))}

              </Select>

              <PermissionGate permission={PERMISSION.MANAGE_GROUPS}>
              <Button

                type="button"

                variant="secondary"

                disabled={!selectedGroupId}

                onClick={() =>

                  setWorkflowMessage(`Group assignment recorded for ${data.fullName}.`)

                }

              >

                Assign Group

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

              aria-label="Approve application"

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

              aria-label="Reject application"

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

              onClick={() => setWorkflowMessage(`Risk escalation opened for ${data.fullName}.`)}

            >

              Escalate Risk

            </Button>
            </PermissionGate>

            <PermissionGate permission={PERMISSION.APPROVE_BORROWERS}>
            <Button

              type="button"

              variant="danger"

              disabled={isSubmitting}

              aria-label="Blacklist application"

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

