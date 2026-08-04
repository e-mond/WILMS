import { z } from 'zod';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled } from '../../db/client.js';
import {
  buildListResponse,
  mapAllocationToActivity,
  mapPoolRowToSummary,
  type LoanPoolDetailDto,
  type LoanPoolListResponseDto,
} from '../../domain/loan-pool/mappers.js';
import { computeLoanPortfolioTotals } from '../../domain/loan-pool/portfolio-totals.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import * as poolRepo from '../../repositories/loan-pool.repository.js';

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for loan pool operations.');
  }
}

/**
 * Lists all loan pools with portfolio summary aggregates for the super-admin dashboard.
 */
export async function listLoanPools(): Promise<LoanPoolListResponseDto> {
  requireDatabase();

  if (await poolRepo.hasLoansMissingPoolAllocations()) {
    await poolRepo.reconcilePoolAllocationsFromLoans();
  }

  const rows = await poolRepo.listPools();
  const regionCounters = new Map<string, number>();
  const pools = rows.map((row) => {
    const regionKey = row.region.trim().toLowerCase();
    const nextSequence = (regionCounters.get(regionKey) ?? 0) + 1;
    regionCounters.set(regionKey, nextSequence);
    return mapPoolRowToSummary(row, nextSequence);
  });

  const response = buildListResponse(pools);
  const loanTotals = await computeLoanPortfolioTotals();

  return {
    ...response,
    summary: {
      ...response.summary,
      totalDisbursedPesewas: Math.max(
        response.summary.totalDisbursedPesewas,
        loanTotals.totalDisbursedPesewas,
      ),
      totalCollectedPesewas: Math.max(
        response.summary.totalCollectedPesewas,
        loanTotals.totalCollectedPesewas,
      ),
      totalOutstandingPesewas: Math.max(
        response.summary.totalOutstandingPesewas,
        loanTotals.totalOutstandingPesewas,
      ),
    },
  };
}

/**
 * Returns pool detail including recent allocation activity (append-only audit trail).
 */
export async function getLoanPool(id: string): Promise<LoanPoolDetailDto> {
  requireDatabase();
  const row = await poolRepo.findPoolById(id);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  const allocations = await poolRepo.listRecentAllocations(id, 10);
  const summary = mapPoolRowToSummary(row, 1);

  return {
    ...summary,
    recentActivity: allocations.map(mapAllocationToActivity),
  };
}

export const createLoanPoolSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  source: z.string().min(1),
  capitalPesewas: z.number().int().positive(),
  cycleLabel: z.string().min(1),
  groupIds: z.array(z.string().uuid()).max(200).optional(),
});

export type CreateLoanPoolInput = z.infer<typeof createLoanPoolSchema>;

export const assignPoolMembershipSchema = z.object({
  groupId: z.string().uuid(),
});

export type AssignPoolMembershipInput = z.infer<typeof assignPoolMembershipSchema>;

/**
 * Creates a new loan pool with initial capital recorded as a REPLENISHMENT allocation.
 */
export async function createLoanPool(
  input: CreateLoanPoolInput,
  actorId: string,
  actorDisplayName?: string,
): Promise<LoanPoolDetailDto> {
  requireDatabase();

  const poolId = uuidv7();
  const now = new Date();
  const groupIds = [...new Set(input.groupIds ?? [])];

  for (const groupId of groupIds) {
    if (!(await poolRepo.groupExists(groupId))) {
      throw new Error('VALIDATION:One or more selected groups were not found.');
    }
    const existingPoolId = await poolRepo.findPoolIdForGroup(groupId);
    if (existingPoolId) {
      throw new Error('VALIDATION:A selected group is already assigned to another loan pool.');
    }
  }

  await poolRepo.insertPool({
    id: poolId,
    name: input.name.trim(),
    region: input.region.trim(),
    source: input.source.trim(),
    capitalPesewas: input.capitalPesewas,
    disbursedPesewas: 0,
    collectedPesewas: 0,
    outstandingPesewas: 0,
    utilisationPercent: 0,
    status: 'LAUNCHING',
    groupCount: 0,
    cycleLabel: input.cycleLabel.trim(),
    lastReplenishedAt: now,
    repaymentRatePercent: '0',
  });

  await poolRepo.appendAllocation({
    poolId,
    allocationType: 'REPLENISHMENT',
    amountPesewas: input.capitalPesewas,
    description: `Initial capital for ${input.name.trim()}`,
    actorUserId: actorId,
    recordedAt: now,
  });

  for (const groupId of groupIds) {
    await poolRepo.insertMembership({ poolId, groupId, assignedAt: now });
  }

  await poolRepo.refreshPoolAggregates(poolId);

  appendAuditEntry({
    action: 'loan-pool.created',
    actorId,
    actorDisplayName,
    targetEntityId: poolId,
    targetEntityType: 'loan-pool',
    reason: `Initial capital: ${input.capitalPesewas} pesewas`,
  });

  return getLoanPool(poolId);
}

/**
 * Assigns a borrower group to a loan pool so subsequent loans update utilisation.
 */
export async function assignPoolMembership(
  poolId: string,
  input: AssignPoolMembershipInput,
  actorId: string,
  actorDisplayName?: string,
): Promise<LoanPoolDetailDto> {
  requireDatabase();

  const pool = await poolRepo.findPoolById(poolId);
  if (!pool) {
    throw new Error('NOT_FOUND');
  }

  if (!(await poolRepo.groupExists(input.groupId))) {
    throw new Error('VALIDATION:Group not found.');
  }

  const existingPoolId = await poolRepo.findPoolIdForGroup(input.groupId);
  if (existingPoolId && existingPoolId !== poolId) {
    throw new Error('VALIDATION:This group is already assigned to another loan pool.');
  }

  if (!existingPoolId) {
    await poolRepo.insertMembership({ poolId, groupId: input.groupId });
    await poolRepo.refreshPoolAggregates(poolId);

    appendAuditEntry({
      action: 'loan-pool.group-assigned',
      actorId,
      actorDisplayName,
      targetEntityId: poolId,
      targetEntityType: 'loan-pool',
      reason: `Assigned group ${input.groupId}`,
    });
  }

  return getLoanPool(poolId);
}

export async function listUnassignedGroupsForPools(): Promise<
  { id: string; name: string; community: string }[]
> {
  requireDatabase();
  return poolRepo.listUnassignedGroupOptions();
}
