/**
 * P14.3B Phase 2 — Adjustment domain types aligned with frontend contract.
 */
export const ADJUSTMENT_TYPE = {
  PAYMENT_CORRECTION: 'PAYMENT_CORRECTION',
  DISBURSEMENT_CORRECTION: 'DISBURSEMENT_CORRECTION',
  WRITE_OFF: 'WRITE_OFF',
  BALANCE_ADJUSTMENT: 'BALANCE_ADJUSTMENT',
} as const;

export type AdjustmentType = (typeof ADJUSTMENT_TYPE)[keyof typeof ADJUSTMENT_TYPE];

export const ADJUSTMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type AdjustmentStatus = (typeof ADJUSTMENT_STATUS)[keyof typeof ADJUSTMENT_STATUS];

export interface AdjustmentRequestDto {
  id: string;
  type: AdjustmentType;
  borrowerId: string;
  borrowerName: string;
  loanId?: string;
  amountPesewas: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: AdjustmentStatus;
}

export interface AdjustmentListResponseDto {
  generatedAt: string;
  pendingCount: number;
  requests: AdjustmentRequestDto[];
}

export interface AdjustmentDetailDto extends AdjustmentRequestDto {
  beforeBalancePesewas?: number;
  afterBalancePesewas?: number;
  deltaPesewas?: number;
  rejectionReason?: string;
}
