import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  appendAuditEntry: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: mocks.getDb,
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: mocks.appendAuditEntry,
}));

vi.mock('../../repositories/user.repository.js', () => ({
  getUserById: mocks.getUserById,
}));

import {
  assignRiskFlag,
  createRiskFlag,
  escalateRiskFlag,
  resolveRiskFlag,
} from '../../modules/risk-flags/service.js';

function mockSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mocks.select.mockReturnValue({ from });
  return { limit, where, from };
}

describe('risk-flags service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDb.mockReturnValue({
      insert: mocks.insert,
      update: mocks.update,
      select: mocks.select,
    });
    mocks.insert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    mocks.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    mocks.appendAuditEntry.mockReturnValue({ id: 'audit-1' });
  });

  it('creates a risk flag and writes audit entry', async () => {
    const flagRow = {
      id: 'flag-1',
      entityId: 'entity-1',
      entityName: 'Jane Doe',
      entityType: 'BORROWER',
      groupName: null,
      flagType: 'MISSED_PAYMENT',
      community: 'Accra',
      officerName: 'Officer',
      raisedAt: new Date('2026-06-01T00:00:00.000Z'),
      arrearsPesewas: 5000,
      status: 'OPEN',
      weeksOverdue: null,
      activeMembers: null,
      totalMembers: null,
      reason: 'Late payment',
      deletedAt: null,
    };

    mockSelectChain([flagRow]);

    const result = await createRiskFlag(
      {
        entityId: 'entity-1',
        entityName: 'Jane Doe',
        entityType: 'BORROWER',
        flagType: 'MISSED_PAYMENT',
        community: 'Accra',
        reason: 'Late payment',
        officerName: 'Officer',
        arrearsPesewas: 5000,
      },
      'actor-1',
      'Super Admin',
    );

    expect(mocks.insert).toHaveBeenCalled();
    expect(mocks.appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'risk-flag.raised',
        actorId: 'actor-1',
        targetEntityType: 'risk-flag',
      }),
    );
    expect(result.entityName).toBe('Jane Doe');
    expect(result.flagType).toBe('MISSED_PAYMENT');
  });

  it('escalates a risk flag to BLACKLISTED / CRITICAL', async () => {
    const flagRow = {
      id: 'flag-1',
      entityId: 'entity-1',
      entityName: 'Jane Doe',
      entityType: 'BORROWER',
      groupName: null,
      flagType: 'BLACKLISTED',
      community: 'Accra',
      officerName: 'Officer',
      raisedAt: new Date('2026-06-01T00:00:00.000Z'),
      arrearsPesewas: 5000,
      status: 'CRITICAL',
      weeksOverdue: null,
      activeMembers: null,
      totalMembers: null,
      reason: 'Escalated',
      deletedAt: null,
    };

    mockSelectChain([{ ...flagRow, status: 'OPEN', flagType: 'MISSED_PAYMENT' }]);
    mockSelectChain([flagRow]);

    const result = await escalateRiskFlag('flag-1', 'actor-1', 'Super Admin');

    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'risk-flag.escalated' }),
    );
    expect(result.flagType).toBe('BLACKLISTED');
    expect(result.status).toBe('CRITICAL');
  });

  it('resolves a risk flag', async () => {
    const flagRow = {
      id: 'flag-1',
      entityId: 'entity-1',
      entityName: 'Jane Doe',
      entityType: 'BORROWER',
      groupName: null,
      flagType: 'MISSED_PAYMENT',
      community: 'Accra',
      officerName: 'Officer',
      raisedAt: new Date('2026-06-01T00:00:00.000Z'),
      arrearsPesewas: 0,
      status: 'RESOLVED',
      weeksOverdue: null,
      activeMembers: null,
      totalMembers: null,
      reason: 'Cleared',
      deletedAt: null,
    };

    mockSelectChain([{ ...flagRow, status: 'OPEN' }]);
    mockSelectChain([flagRow]);

    const result = await resolveRiskFlag('flag-1', 'actor-1', 'Cleared', 'Super Admin');

    expect(mocks.appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'risk-flag.resolved', reason: 'Cleared' }),
    );
    expect(result.status).toBe('RESOLVED');
  });

  it('assigns a risk flag to a user', async () => {
    mocks.getUserById.mockResolvedValue({ id: 'user-2', displayName: 'Reviewer' });

    const flagRow = {
      id: 'flag-1',
      entityId: 'entity-1',
      entityName: 'Jane Doe',
      entityType: 'BORROWER',
      groupName: null,
      flagType: 'MISSED_PAYMENT',
      community: 'Accra',
      officerName: 'Officer',
      raisedAt: new Date('2026-06-01T00:00:00.000Z'),
      arrearsPesewas: 0,
      status: 'UNDER_REVIEW',
      weeksOverdue: null,
      activeMembers: null,
      totalMembers: null,
      reason: null,
      deletedAt: null,
    };

    mockSelectChain([{ ...flagRow, status: 'OPEN' }]);
    mockSelectChain([flagRow]);

    const result = await assignRiskFlag('flag-1', 'user-2', 'actor-1', 'Super Admin');

    expect(mocks.getUserById).toHaveBeenCalledWith('user-2');
    expect(mocks.appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'risk-flag.assigned' }),
    );
    expect(result.status).toBe('UNDER_REVIEW');
  });
});
