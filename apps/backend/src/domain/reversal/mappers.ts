/**
 * P14.3B Phase 3C.1 — Reversal DTO mappers.
 */
import type { financialReversals } from '../../db/schema/financial-reversals.js';

type ReversalRow = typeof financialReversals.$inferSelect;

export interface PaymentReversalResultDto {
  id: string;
  paymentId: string;
  loanId: string;
  borrowerId: string;
  amountPesewas: number;
  reason: string;
  status: string;
  beforeBalancePesewas: number;
  afterBalancePesewas: number;
  deltaPesewas: number;
  executedAt: string;
  executedBy: string;
}

export function mapReversalToPaymentResult(
  row: ReversalRow,
  actorDisplayName: string,
): PaymentReversalResultDto {
  return {
    id: row.id,
    paymentId: row.sourceId,
    loanId: row.loanId ?? '',
    borrowerId: row.borrowerId,
    amountPesewas: row.amountPesewas,
    reason: row.reason,
    status: row.status,
    beforeBalancePesewas: row.beforeBalancePesewas ?? 0,
    afterBalancePesewas: row.afterBalancePesewas ?? 0,
    deltaPesewas: row.deltaPesewas ?? 0,
    executedAt: row.executedAt?.toISOString() ?? new Date().toISOString(),
    executedBy: actorDisplayName,
  };
}
