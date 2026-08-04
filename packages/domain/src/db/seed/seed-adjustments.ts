/**
 * P14.3B Phase 2 — Seeds standardized adjustment reason codes.
 */
import * as adjustmentRepo from '../../repositories/adjustment.repository.js';

const REASON_SEED = [
  { code: 'FEE_CORRECTION', label: 'Fee correction', category: 'FEE_CORRECTION' as const },
  {
    code: 'INTEREST_CORRECTION',
    label: 'Interest correction',
    category: 'INTEREST_CORRECTION' as const,
  },
  {
    code: 'ADMIN_ADJUSTMENT',
    label: 'Administrative adjustment',
    category: 'ADMINISTRATIVE' as const,
  },
  {
    code: 'BALANCE_CORRECTION',
    label: 'Balance correction',
    category: 'BALANCE_CORRECTION' as const,
  },
  {
    code: 'MANUAL_CORRECTION',
    label: 'Manual correction',
    category: 'MANUAL_CORRECTION' as const,
  },
] as const;

export async function seedAdjustmentReasons(): Promise<void> {
  await adjustmentRepo.seedAdjustmentReasons([...REASON_SEED]);
  console.log(`Seeded ${REASON_SEED.length} adjustment reason codes.`);
}
