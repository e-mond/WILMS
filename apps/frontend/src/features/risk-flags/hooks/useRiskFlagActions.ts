'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { riskFlagService } from '@/services';
import { riskFlagsQueryKey } from '@/features/risk-flags/hooks/useRiskFlags';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { FlagEntityType, FlagType, RiskFlagSummary } from '@/types/risk-flag';

export function useRiskFlagActions() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: riskFlagsQueryKey });
  }, [queryClient]);

  const escalateToBlacklist = useCallback(
    async (flag: RiskFlagSummary) => {
      try {
        await riskFlagService.escalateRiskFlag(flag.id);
        invalidate();
        toast.warning('Escalate to Blacklist', {
          message: `${flag.entityName} queued for Super Admin approval.`,
        });
      } catch {
        toast.error('Unable to escalate flag', { message: 'Try again shortly.' });
      }
    },
    [invalidate, toast],
  );

  const markResolved = useCallback(
    async (flag: RiskFlagSummary) => {
      try {
        await riskFlagService.resolveRiskFlag(flag.id);
        invalidate();
        toast.success('Flag resolved', { message: `${flag.id} marked resolved.` });
      } catch {
        toast.error('Unable to resolve flag', { message: 'Try again shortly.' });
      }
    },
    [invalidate, toast],
  );

  const assignOfficer = useCallback(
    async (flag: RiskFlagSummary) => {
      const assignedToUserId = user?.id;
      if (!assignedToUserId) {
        toast.error('Unable to assign officer', { message: 'Sign in to assign review.' });
        return;
      }

      try {
        await riskFlagService.assignRiskFlag(flag.id, { assignedToUserId });
        invalidate();
        toast.info('Officer assigned', { message: `Review assigned for ${flag.id}.` });
      } catch {
        toast.error('Unable to assign officer', { message: 'Try again shortly.' });
      }
    },
    [invalidate, toast, user?.id],
  );

  const raiseFlag = useCallback(
    async (input: {
      entityId: string;
      entityName: string;
      entityType: string;
      flagType: string;
      community: string;
      reason?: string;
    }) => {
      try {
        await riskFlagService.createRiskFlag({
          entityId: input.entityId,
          entityName: input.entityName,
          entityType: input.entityType as FlagEntityType,
          flagType: input.flagType as FlagType,
          community: input.community,
          reason: input.reason,
          officerName: user?.displayName,
        });
        invalidate();
        toast.success('Flag raised', {
          message: `${input.entityName} flagged for review.`,
        });
      } catch {
        toast.error('Unable to raise flag', { message: 'Try again shortly.' });
      }
    },
    [invalidate, toast, user?.displayName],
  );

  return { escalateToBlacklist, markResolved, assignOfficer, raiseFlag };
}

export function useCreateRiskFlag() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: riskFlagService.createRiskFlag,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: riskFlagsQueryKey });
      toast.success('Flag raised', { message: 'Risk flag created successfully.' });
    },
    onError: () => {
      toast.error('Unable to raise flag', { message: 'Try again shortly.' });
    },
  });
}
