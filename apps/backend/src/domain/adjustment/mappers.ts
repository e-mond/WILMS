/**
 * P14.3B Phase 2 — Maps persistence rows to frontend-compatible adjustment DTOs.
 */
import type { financialAdjustments } from '../../db/schema/financial-adjustments.js';
import type {
  AdjustmentDetailDto,
  AdjustmentListResponseDto,
  AdjustmentRequestDto,
} from './types.js';

type AdjustmentRow = typeof financialAdjustments.$inferSelect;

export function mapAdjustmentRowToRequest(row: AdjustmentRow): AdjustmentRequestDto {
  return {
    id: row.id,
    type: row.type,
    borrowerId: row.borrowerId,
    borrowerName: row.borrowerName,
    loanId: row.loanId ?? undefined,
    amountPesewas: row.amountPesewas,
    reason: row.reason,
    requestedBy: row.requestedByDisplayName,
    requestedAt: row.requestedAt.toISOString(),
    status: row.status,
  };
}

export function mapAdjustmentRowToDetail(row: AdjustmentRow): AdjustmentDetailDto {
  return {
    ...mapAdjustmentRowToRequest(row),
    beforeBalancePesewas: row.beforeBalancePesewas ?? undefined,
    afterBalancePesewas: row.afterBalancePesewas ?? undefined,
    deltaPesewas: row.deltaPesewas ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
  };
}

export function buildPendingListResponse(rows: AdjustmentRow[]): AdjustmentListResponseDto {
  const requests = rows.map(mapAdjustmentRowToRequest);
  return {
    generatedAt: new Date().toISOString(),
    pendingCount: requests.length,
    requests,
  };
}

export function buildAdjustmentListResponse(rows: AdjustmentRow[]): {
  generatedAt: string;
  count: number;
  adjustments: AdjustmentDetailDto[];
} {
  return {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    adjustments: rows.map(mapAdjustmentRowToDetail),
  };
}
