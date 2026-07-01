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
  const rows = await poolRepo.listPools();
  const pools = rows.map(mapPoolRowToSummary);
  return buildListResponse(pools);
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
  const summary = mapPoolRowToSummary(row);

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
});

export type CreateLoanPoolInput = z.infer<typeof createLoanPoolSchema>;

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
