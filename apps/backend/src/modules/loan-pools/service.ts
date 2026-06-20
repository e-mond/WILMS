import { isDatabaseEnabled } from '../../db/client.js';
import {
  buildListResponse,
  mapAllocationToActivity,
  mapPoolRowToSummary,
  type LoanPoolDetailDto,
  type LoanPoolListResponseDto,
} from '../../domain/loan-pool/mappers.js';
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
