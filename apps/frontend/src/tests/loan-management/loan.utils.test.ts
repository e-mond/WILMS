import { describe, expect, it } from 'vitest';
import {
  calculateWeeklyPaymentPesewas,
  parseGhsToPesewas,
} from '@/features/loan-management/loan.utils';

describe('loan.utils', () => {
  it('parses GHS strings into pesewas', () => {
    expect(parseGhsToPesewas('300')).toBe(30000);
    expect(parseGhsToPesewas('1,250.50')).toBe(125050);
  });

  it('calculates weekly payment as amount divided by duration', () => {
    expect(calculateWeeklyPaymentPesewas(30000, 12)).toBe(2500);
    expect(calculateWeeklyPaymentPesewas(50000, 10)).toBe(5000);
  });
});
