import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  groupBy: vi.fn(),
}));

vi.mock('../../db/persistence.js', () => ({
  listBorrowers: vi.fn(async () => []),
  listPayments: vi.fn(async () => []),
  listGroups: vi.fn(async () => []),
  countBorrowers: vi.fn(async () => 0),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  getDb: () => ({
    select: dbMocks.select,
    execute: vi.fn(async () => ({ rows: [] })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(async () => [
            {
              id: 'default',
              adminFeePesewas: 5000,
              reconciliationVarianceThresholdPercent: 5,
              smsNotificationsEnabled: true,
              emailNotificationsEnabled: true,
              paymentReminderDaysBefore: 1,
              minGroupSize: 5,
              maxGroupSize: 15,
              organisationName: 'WILMS',
              systemName: "Women's Interest-Free Loan Management System",
              primaryColour: '#0F6E56',
              accentColour: '#BA7517',
              logoAsset: 'wilms-logo.svg',
              sessionTimeoutMinutes: 30,
              twoFactorRequired: false,
              ipAllowlistEnabled: false,
              failedLoginLockoutAttempts: 5,
              passwordPolicy: 'strong',
              maxLoanAmountPesewas: 500_000,
              defaultLoanDurationWeeks: 12,
              allowLoanRollovers: true,
              latePaymentGraceDays: 3,
              smsProvider: 'smsnotifygh',
              smsSenderId: 'WILMS-GH',
              missedPaymentSmsEnabled: true,
              approvalSmsEnabled: true,
              supervisorEscalationsEnabled: true,
              immutableAuditTrail: true,
              auditExportEnabled: true,
              monitoringAlertsEnabled: true,
              gpsVerificationEnabled: true,
              emailProviderLabel: 'Gmail SMTP',
              updatedAt: new Date('2026-06-01T08:00:00.000Z'),
            },
          ]),
        })),
      })),
    })),
  }),
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  listLoans: vi.fn(async () => []),
}));

vi.mock('../../repositories/loan-pool.repository.js', () => ({
  listPools: vi.fn(async () => []),
}));

vi.mock('../../repositories/user.repository.js', () => ({
  listCollectors: vi.fn(async () => []),
}));

function mockEmptySelectChain() {
  dbMocks.groupBy.mockResolvedValue([]);
  const whereResult = {
    groupBy: dbMocks.groupBy,
    limit: vi.fn(() => Promise.resolve([])),
    then(onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve([]).then(onFulfilled, onRejected);
    },
  };
  dbMocks.where.mockReturnValue(whereResult);
  dbMocks.from.mockReturnValue({
    where: dbMocks.where,
    groupBy: dbMocks.groupBy,
  });
  dbMocks.select.mockReturnValue({ from: dbMocks.from });
}

import { getDashboardSummary } from '../../modules/dashboard/service.js';
import { listBorrowerSummaries } from '../../modules/borrowers/service.js';
import { listLoans, listPortfolioEntries } from '../../modules/loans/service.js';
import { listLoanPools } from '../../modules/loan-pools/service.js';
import { listGroupsResponse } from '../../modules/groups/service.js';
import { listCollectors } from '../../modules/collectors/service.js';
import { listRiskFlags } from '../../modules/risk-flags/service.js';

describe('empty database list handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmptySelectChain();
  });

  it('returns dashboard summary with zero KPIs', async () => {
    const summary = await getDashboardSummary();
    expect(summary.borrowerSegments.every((segment) => segment.count === 0)).toBe(true);
    expect(summary.totalGroups).toBe(0);
  });

  it('returns empty borrower list', async () => {
    await expect(listBorrowerSummaries()).resolves.toEqual([]);
  });

  it('returns empty loan lists', async () => {
    await expect(listLoans('ACTIVE')).resolves.toEqual([]);
    await expect(listPortfolioEntries()).resolves.toEqual([]);
  });

  it('returns empty loan pool list response', async () => {
    const response = await listLoanPools();
    expect(response.pools).toEqual([]);
  });

  it('returns empty groups response', async () => {
    const response = await listGroupsResponse();
    expect(response.groups).toEqual([]);
    expect(response.summary.activeGroups).toBe(0);
  });

  it('returns empty collectors response', async () => {
    const response = await listCollectors();
    expect(response.collectors).toEqual([]);
    expect(response.summary.totalCollectors).toBe(0);
  });

  it('returns empty risk flags response', async () => {
    const response = await listRiskFlags();
    expect(response.flags).toEqual([]);
    expect(response.summary.openFlags).toBe(0);
  });
});
