'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { riskFlagService } from '@/services';
import { riskFlagsQueryKey } from '@/features/risk-flags/hooks/useRiskFlags';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { resolveRiskFlagDisplayId } from '@/utils/entity-display-id';
import type { FlagEntityType, FlagType, RiskFlagSummary } from '@/types/risk-flag';

export function useRiskFlagActions() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: riskFlagsQueryKey });
    void queryClient.invalidateQueries({ queryKey: ['risk-flags', 'detail'] });
  }, [queryClient]);

  const escalateToBlacklist = useCallback(
    async (flag: RiskFlagSummary) => {
      try {
        const detail = await riskFlagService.escalateRiskFlag(flag.id);
        invalidate();
        const message =
          detail.escalation?.message ??
          'Flag marked critical for blacklist review.';
        if (detail.escalation?.borrowerBlacklisted) {
          toast.success('Escalated to blacklist', { message });
        } else {
          toast.warning('Escalated to critical', { message });
        }
      } catch {
        toast.error('Unable to escalate flag', { message: 'Try again shortly.' });
      }
    },
    [invalidate, toast],
  );

  const markResolved = useCallback(
    async (flag: RiskFlagSummary, reason: string) => {
      try {
        await riskFlagService.resolveRiskFlag(flag.id, { reason });
        invalidate();
        const label = resolveRiskFlagDisplayId(flag);
        toast.success('Flag resolved', { message: `${label} marked resolved.` });
      } catch {
        toast.error('Unable to resolve flag', { message: 'Try again shortly.' });
      }
    },
    [invalidate, toast],
  );

  const assignOfficer = useCallback(
    async (flag: RiskFlagSummary, assignedToUserId: string) => {
      try {
        const detail = await riskFlagService.assignRiskFlag(flag.id, { assignedToUserId });
        invalidate();
        const label = resolveRiskFlagDisplayId(flag);
        const assigneeName = detail.assignedToName ?? 'officer';
        toast.info('Officer assigned', {
          message: `${label} assigned to ${assigneeName}. They were notified.`,
        });
      } catch {
        toast.error('Unable to assign officer', { message: 'Try again shortly.' });
      }
    },
    [invalidate, toast],
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
