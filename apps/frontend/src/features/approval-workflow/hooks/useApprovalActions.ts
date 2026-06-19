'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import { pendingApplicationsQueryKey } from '@/features/approval-workflow/hooks/usePendingApplications';
import { reviewedApplicationsQueryKey } from '@/features/approval-workflow/hooks/useReviewedApplications';
import { borrowerReviewQueryKey } from '@/features/approval-workflow/hooks/useBorrowerReview';
import { auditService, borrowerService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import type { BlacklistBorrowerInput, RejectBorrowerInput } from '@/types/approval';
import type { CreateAuditEntryInput } from '@/types/audit';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

async function logApprovalAuditEntry(
  borrowerId: string,
  input: Pick<CreateAuditEntryInput, 'action' | 'reason'>,
): Promise<void> {
  const user = useAuthStore.getState().user;

  if (!user) {
    return;
  }

  await auditService.createEntry({
    action: input.action,
    actorId: user.id,
    actorDisplayName: user.displayName,
    targetEntityId: borrowerId,
    targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
    reason: input.reason,
  });
}

export function useApprovalActions(borrowerId: string) {
  const queryClient = useQueryClient();

  const invalidateApprovalQueries = async () => {
    const approverId = useAuthStore.getState().user?.id;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pendingApplicationsQueryKey }),
      queryClient.invalidateQueries({ queryKey: borrowerReviewQueryKey(borrowerId) }),
      queryClient.invalidateQueries({ queryKey: ['borrowers', 'my-registrations'] }),
      approverId
        ? queryClient.invalidateQueries({ queryKey: reviewedApplicationsQueryKey(approverId) })
        : Promise.resolve(),
    ]);
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      const result = await borrowerService.approveBorrower(borrowerId);
      await logApprovalAuditEntry(borrowerId, { action: AUDIT_ACTION.BORROWER_APPROVED });
      await invalidateApprovalQueries();
      return result;
    },
    onSuccess: () => {
      notifyMutationSuccess('Borrower approved', 'The application has been approved.');
    },
    onError: (error) => {
      notifyMutationError('Approval failed', error, 'Unable to approve this application.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (input: RejectBorrowerInput) => {
      const result = await borrowerService.rejectBorrower(borrowerId, input);
      await logApprovalAuditEntry(borrowerId, {
        action: AUDIT_ACTION.BORROWER_REJECTED,
        reason: input.reason,
      });
      await invalidateApprovalQueries();
      return result;
    },
    onSuccess: () => {
      notifyMutationSuccess('Borrower rejected', 'The rejection has been recorded.');
    },
    onError: (error) => {
      notifyMutationError('Rejection failed', error, 'Unable to reject this application.');
    },
  });

  const blacklistMutation = useMutation({
    mutationFn: async (input: BlacklistBorrowerInput) => {
      const result = await borrowerService.blacklistBorrower(borrowerId, input);
      await logApprovalAuditEntry(borrowerId, {
        action: AUDIT_ACTION.BORROWER_BLACKLISTED,
        reason: input.reason,
      });
      await invalidateApprovalQueries();
      return result;
    },
    onSuccess: () => {
      notifyMutationSuccess('Borrower blacklisted', 'The blacklist action has been recorded.');
    },
    onError: (error) => {
      notifyMutationError('Blacklist failed', error, 'Unable to blacklist this applicant.');
    },
  });

  return {
    approveMutation,
    rejectMutation,
    blacklistMutation,
    isSubmitting:
      approveMutation.isPending || rejectMutation.isPending || blacklistMutation.isPending,
  };
}
