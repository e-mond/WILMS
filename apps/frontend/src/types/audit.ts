import type { AuditAction, AuditTargetEntity } from '@/constants/audit';

export interface CreateAuditEntryInput {
  action: AuditAction;
  actorId: string;
  actorDisplayName?: string;
  targetEntityId: string;
  targetEntityType: AuditTargetEntity;
  reason?: string;
}
