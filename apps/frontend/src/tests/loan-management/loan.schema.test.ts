import { describe, expect, it } from 'vitest';
import { createLoanSchema } from '@/features/loan-management/loan.schema';

describe('createLoanSchema', () => {
  it('accepts a valid loan with evenly divisible amount', () => {
    const parsed = createLoanSchema.safeParse({
      borrowerId: 'borrower-003',
      amountGhs: '300',
      durationWeeks: 12,
      paymentDay: 'Monday',
      cycleBatch: 'Cycle 2 — April 2026',
      startDate: '2026-06-10',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts Sunday as a payment day and custom cycle labels', () => {
    const parsed = createLoanSchema.safeParse({
      borrowerId: 'borrower-003',
      amountGhs: '300',
      durationWeeks: 12,
      paymentDay: 'Sunday',
      cycleBatch: 'Cycle 5 — January 2027',
      startDate: '2026-06-10',
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects amounts that do not divide evenly across weeks', () => {
    const parsed = createLoanSchema.safeParse({
      borrowerId: 'borrower-003',
      amountGhs: '300.01',
      durationWeeks: 12,
      paymentDay: 'Monday',
      cycleBatch: 'Cycle 2 — April 2026',
      startDate: '2026-06-10',
    });

    expect(parsed.success).toBe(false);
  });
});
