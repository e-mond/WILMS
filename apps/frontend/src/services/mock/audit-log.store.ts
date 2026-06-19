import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import type { AuditEntry } from '@/types/services';
import type { CreateAuditEntryInput } from '@/types/audit';
import { resolveMockPhotoUrl } from '@/services/mock/photo-url.resolver';

const SEED_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'audit-001',
    action: AUDIT_ACTION.BORROWER_REGISTERED,
    actorId: 'officer-001',
    actorDisplayName: 'Registration Officer',
    targetEntityId: 'borrower-approved-001',
    targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'audit-002',
    action: AUDIT_ACTION.PAYMENT_RECORDED,
    actorId: 'collector-001',
    actorDisplayName: 'Field Collector',
    targetEntityId: 'payment-001',
    targetEntityType: AUDIT_TARGET_ENTITY.PAYMENT,
    createdAt: '2026-06-01T11:00:00.000Z',
  },
  {
    id: 'audit-003',
    action: AUDIT_ACTION.BORROWER_APPROVED,
    actorId: 'user-approver',
    actorDisplayName: 'Loan Approver',
    targetEntityId: 'borrower-001',
    targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
    createdAt: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'audit-004',
    action: AUDIT_ACTION.BORROWER_APPROVED,
    actorId: 'user-approver',
    actorDisplayName: 'Loan Approver',
    targetEntityId: 'borrower-002',
    targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
    createdAt: '2026-02-05T11:30:00.000Z',
  },
  {
    id: 'audit-005',
    action: AUDIT_ACTION.BORROWER_BLACKLISTED,
    actorId: 'user-approver',
    actorDisplayName: 'Loan Approver',
    targetEntityId: 'borrower-blacklisted-001',
    targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
    reason: 'Fraudulent documentation submitted.',
    createdAt: '2025-11-15T14:00:00.000Z',
  },
];

let auditEntries: AuditEntry[] = [...SEED_AUDIT_ENTRIES];
let nextAuditId = auditEntries.length + 1;

export function getAuditEntries(): readonly AuditEntry[] {
  return auditEntries;
}

export function appendAuditEntry(input: CreateAuditEntryInput): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${String(nextAuditId).padStart(3, '0')}`,
    action: input.action,
    actorId: input.actorId,
    actorDisplayName: input.actorDisplayName,
    actorPhotoUrl: resolveMockPhotoUrl({
      name: input.actorDisplayName ?? input.actorId,
      id: input.actorId,
    }),
    targetEntityId: input.targetEntityId,
    targetEntityType: input.targetEntityType,
    reason: input.reason?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  nextAuditId += 1;
  auditEntries = [...auditEntries, entry];
  return entry;
}

export function resetAuditLog(): void {
  auditEntries = [...SEED_AUDIT_ENTRIES];
  nextAuditId = auditEntries.length + 1;
}
