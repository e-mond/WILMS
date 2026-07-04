import { randomUUID } from 'node:crypto';
import { formatEntityDisplayId, formatPaymentDisplayId, formatUserDisplayId, isReadableWilmsId } from '@wilms/shared-utils';
import { isDatabaseEnabled } from '../../db/client.js';
import { auditRepository } from '../../repositories/index.js';

export interface AuditEntryRecord {
  id: string;
  action: string;
  actorId: string;
  actorDisplayName?: string;
  actorDisplayId?: string;
  targetEntityId: string;
  targetEntityType: string;
  targetEntityDisplayId?: string;
  reason?: string;
  createdAt: string;
}

export interface CreateAuditEntryInput {
  action: string;
  actorId: string;
  actorDisplayName?: string;
  targetEntityId: string;
  targetEntityType: string;
  reason?: string;
}

const entries: AuditEntryRecord[] = [];

function resolveActorDisplayId(entry: Pick<AuditEntryRecord, 'actorId' | 'actorDisplayName'>): string {
  if (entry.actorDisplayName && isReadableWilmsId(entry.actorDisplayName)) {
    return entry.actorDisplayName.toUpperCase();
  }

  return formatUserDisplayId({ id: entry.actorId });
}

function resolveTargetEntityDisplayId(
  entry: Pick<AuditEntryRecord, 'targetEntityId' | 'targetEntityType' | 'createdAt'>,
): string {
  if (isReadableWilmsId(entry.targetEntityId)) {
    return entry.targetEntityId.toUpperCase();
  }

  if (entry.targetEntityType === 'payment') {
    return formatPaymentDisplayId({ recordedAt: entry.createdAt });
  }

  return formatEntityDisplayId({
    entityType: entry.targetEntityType,
    entityId: entry.targetEntityId,
  });
}

function enrichAuditEntry(entry: AuditEntryRecord): AuditEntryRecord {
  return {
    ...entry,
    actorDisplayId: resolveActorDisplayId(entry),
    targetEntityDisplayId: resolveTargetEntityDisplayId(entry),
  };
}

export function appendAuditEntry(input: CreateAuditEntryInput): AuditEntryRecord {
  const record: AuditEntryRecord = enrichAuditEntry({
    id: `audit-${randomUUID()}`,
    action: input.action,
    actorId: input.actorId,
    actorDisplayName: input.actorDisplayName,
    targetEntityId: input.targetEntityId,
    targetEntityType: input.targetEntityType,
    reason: input.reason,
    createdAt: new Date().toISOString(),
  });

  entries.unshift(record);

  if (isDatabaseEnabled()) {
    void auditRepository.appendAuditEntry(input).catch((error) => {
      console.error('Failed to persist audit entry:', error);
    });
  }

  return record;
}

export async function listAuditEntries(params?: {
  limit?: number;
  action?: string;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<AuditEntryRecord[]> {
  if (isDatabaseEnabled()) {
    const rows = await auditRepository.listAuditEntries(params?.limit ?? 100);
    let result = rows;

    if (params?.action) {
      result = result.filter((entry) => entry.action === params.action);
    }

    if (params?.actorId) {
      result = result.filter((entry) => entry.actorId === params.actorId);
    }

    if (params?.fromDate) {
      result = result.filter((entry) => entry.createdAt >= params.fromDate!);
    }

    if (params?.toDate) {
      result = result.filter((entry) => entry.createdAt <= params.toDate!);
    }

    return result.map(enrichAuditEntry);
  }

  let result = [...entries];

  if (params?.action) {
    result = result.filter((entry) => entry.action === params.action);
  }

  if (params?.actorId) {
    result = result.filter((entry) => entry.actorId === params.actorId);
  }

  if (params?.fromDate) {
    result = result.filter((entry) => entry.createdAt >= params.fromDate!);
  }

  if (params?.toDate) {
    result = result.filter((entry) => entry.createdAt <= params.toDate!);
  }

  const limit = params?.limit ?? 100;
  return result.slice(0, limit).map(enrichAuditEntry);
}
