'use client';

import { useCallback } from 'react';
import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import { auditService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { RiskFlagSummary } from '@/types/risk-flag';

export function useRiskFlagActions() {
  const { user } = useAuth();
  const toast = useToast();

  const recordAction = useCallback(
    async (flag: RiskFlagSummary, action: (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION], reason: string) => {
      await auditService.createEntry({
        action,
        actorId: user?.id ?? 'unknown',
        actorDisplayName: user?.displayName ?? 'Super Admin',
        targetEntityId: flag.id,
        targetEntityType: AUDIT_TARGET_ENTITY.RISK_FLAG,
        reason,
      });
    },
    [user?.displayName, user?.id],
  );

  const escalateToBlacklist = useCallback(
    async (flag: RiskFlagSummary) => {
      await recordAction(flag, AUDIT_ACTION.RISK_FLAG_ESCALATED, `Escalated ${flag.entityName} to blacklist review`);
      toast.warning('Escalate to Blacklist', {
        message: `${flag.id} queued for Super Admin approval. Audit record created.`,
      });
    },
    [recordAction, toast],
  );

  const markResolved = useCallback(
    async (flag: RiskFlagSummary) => {
      await recordAction(flag, AUDIT_ACTION.RISK_FLAG_RESOLVED, `Resolved flag ${flag.id}`);
      toast.success('Flag resolved', { message: `${flag.id} marked resolved. Audit record created.` });
    },
    [recordAction, toast],
  );

  const assignOfficer = useCallback(
    async (flag: RiskFlagSummary) => {
      await recordAction(flag, AUDIT_ACTION.RISK_FLAG_ASSIGNED, `Assigned officer review for ${flag.id}`);
      toast.info('Officer assigned', { message: `Review assignment logged for ${flag.id}.` });
    },
    [recordAction, toast],
  );

  const raiseFlag = useCallback(
    async (input: { entityName: string; entityType: string; flagType: string; community: string }) => {
      await auditService.createEntry({
        action: AUDIT_ACTION.RISK_FLAG_RAISED,
        actorId: user?.id ?? 'unknown',
        actorDisplayName: user?.displayName ?? 'Super Admin',
        targetEntityId: input.entityName,
        targetEntityType: AUDIT_TARGET_ENTITY.RISK_FLAG,
        reason: `${input.flagType} flag raised for ${input.entityName} in ${input.community}`,
      });
      toast.success('Flag raised', {
        message: `${input.entityName} flagged for review. Audit record created.`,
      });
    },
    [toast, user?.displayName, user?.id],
  );

  return { escalateToBlacklist, markResolved, assignOfficer, raiseFlag };
}
