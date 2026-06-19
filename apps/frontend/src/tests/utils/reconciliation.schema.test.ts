import { describe, expect, it } from 'vitest';
import {
  ghsInputToPesewas,
  reconciliationFormSchema,
} from '@/utils/reconciliation.schema';

describe('reconciliation.schema', () => {
  it('validates physical cash input', () => {
    expect(reconciliationFormSchema.safeParse({ physicalCashGhs: '12.50' }).success).toBe(true);
    expect(reconciliationFormSchema.safeParse({ physicalCashGhs: '' }).success).toBe(false);
  });

  it('converts ghs input to pesewas', () => {
    expect(ghsInputToPesewas('10.25')).toBe(1025);
  });
});
