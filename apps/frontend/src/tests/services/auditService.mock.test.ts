import { beforeEach, describe, expect, it } from 'vitest';
import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import auditServiceMock, { resetMockAuditLog } from '@/services/mock/auditService.mock';
import { getAuditEntries } from '@/services/mock/audit-log.store';

describe('auditService.mock', () => {
  beforeEach(() => {
    resetMockAuditLog();
  });

  it('creates immutable approval audit entries with actor, target, and reason', async () => {
    const entry = await auditServiceMock.createEntry({
      action: AUDIT_ACTION.BORROWER_REJECTED,
      actorId: 'user-approver',
      actorDisplayName: 'Test Approver',
      targetEntityId: 'borrower-pending-001',
      targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
      reason: 'Identity could not be verified.',
    });

    expect(entry).toMatchObject({
      action: AUDIT_ACTION.BORROWER_REJECTED,
      actorId: 'user-approver',
      actorDisplayName: 'Test Approver',
      targetEntityId: 'borrower-pending-001',
      targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
      reason: 'Identity could not be verified.',
    });
    expect(entry.id).toMatch(/^audit-\d{3}$/);
    expect(entry.createdAt).toBeTruthy();

    const entries = getAuditEntries();
    expect(entries).toHaveLength(6);
    expect(entries.at(-1)).toEqual(entry);
  });

  it('lists recent entries newest first', async () => {
    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.BORROWER_APPROVED,
      actorId: 'user-approver',
      targetEntityId: 'borrower-pending-002',
      targetEntityType: AUDIT_TARGET_ENTITY.BORROWER,
    });

    const entries = await auditServiceMock.listRecentEntries({ limit: 1 });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe(AUDIT_ACTION.BORROWER_APPROVED);
  });
});
