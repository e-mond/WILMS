import { ADJUSTMENT_TYPE, type AdjustmentType } from '@/types/adjustment';

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  [ADJUSTMENT_TYPE.PAYMENT_CORRECTION]: 'Payment correction',
  [ADJUSTMENT_TYPE.DISBURSEMENT_CORRECTION]: 'Disbursement correction',
  [ADJUSTMENT_TYPE.WRITE_OFF]: 'Write-off',
  [ADJUSTMENT_TYPE.BALANCE_ADJUSTMENT]: 'Balance adjustment',
};
